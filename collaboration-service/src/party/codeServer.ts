import type * as Party from 'partykit/server';
import {onConnect as y_onConnect} from 'y-partykit';

import {Buffer} from 'node:buffer';

import * as Y from 'yjs';
import {parseCookies} from '../utils/cookies.js';
import {verifyToken} from '../utils/jwt.js';
import {getDocument, upsertDocument, checkRoomExists, checkUserVerified} from '../storage/db.js';

const CHAT_HISTORY_LIMIT = 500;
const CHAT_COLLECTION_KEY = 'chatMessages';
const EXECUTION_STATE_KEY = 'executionState';

function ensureSharedStructures(doc: Y.Doc) {
  doc.getText('codemirror');
  doc.getMap<string>('config');
  doc.getArray(CHAT_COLLECTION_KEY);
  doc.getMap(EXECUTION_STATE_KEY);
}

function pruneChatHistory(doc: Y.Doc) {
  const chatArray = doc.getArray(CHAT_COLLECTION_KEY);
  if (chatArray.length <= CHAT_HISTORY_LIMIT) {
    return;
  }
  const excess = chatArray.length - CHAT_HISTORY_LIMIT;
  chatArray.delete(0, excess);
}
// import {roomRouter} from '../api/roomRoutes.js';

export default class YjsServer implements Party.Server {
  constructor(public room: Party.Room) {}

  static async onBeforeConnect(request: Party.Request, _lobby: Party.Lobby) {
    try {
      const cookieHeader = request.headers.get('cookie');
      if (!cookieHeader) {
        console.error('No cookie header found');
        return new Response('Unauthorized: No cookies', {status: 401});
      }

      const cookies = parseCookies(cookieHeader);
      const accessToken = cookies['accessToken'];

      if (!accessToken) {
        console.error('No accessToken cookie found');
        return new Response('Unauthorized: No access token', {status: 401});
      }
      const {valid, payload} = await verifyToken(accessToken);

      if (!valid || !payload) {
        console.error('Token verification failed:', payload);
        return new Response('Unauthorized: Invalid token or payload', {status: 401});
      }
      const roomId = new URL(request.url).pathname.split('/').pop();

      if (!roomId) {
        console.error('Room Id is undefined:');
        return new Response('Room Id is undefined', {status: 400});
      }
      const roomExists = await checkRoomExists(roomId);

      if (!roomExists) {
        console.error(`Room ${roomId} not found in active_rooms`);
        return new Response('Room not found', {status: 404});
      }

      // const isUserVerified = await checkUserVerified(payload.userId.toString(), roomId);

      // if (!isUserVerified) {
      //   console.error(`User not authorised to enter this room`);
      //   return new Response('Unauthorised : User not authorised to enter this room', {status: 401});
      // }

      request.headers.set('X-User-ID', payload.userId.toString());

      if (payload.sessionId) {
        try {
          request.headers.set('X-Session-ID', payload.sessionId.toString());
        } catch (sessionIdError) {
          console.warn(
            'Session ID missing or malformed on token payload',
            sessionIdError,
            payload.sessionId
          );
        }
      } else {
        console.info('Session ID not present on token payload; continuing without it');
      }

      return request;
    } catch (e) {
      console.error('Authentication error:', e);
      return new Response('Unauthorized', {status: 401});
    }
  }

  async onConnect(connection: Party.Connection) {
    const room = this.room;
    await y_onConnect(connection, this.room, {
      async load() {
        // This is called once per "room" when the first user connects

        // Creates the backend Yjs document
        const doc = new Y.Doc();

        // Load the document from the database
        try {
          const {data, error} = await getDocument(room.id);
          if (error) {
            throw new Error(error.message);
          }

          if (data) {
            // If the document exists on the database,
            // apply it to the Yjs document
            try {
              const buffer = Buffer.from(data.document, 'base64');
              Y.applyUpdate(doc, new Uint8Array(buffer));
              ensureSharedStructures(doc);
              pruneChatHistory(doc);
            } catch (parseErr) {
              console.warn(`[${room.id}] Data corrupted, creating new document`);
            }
          } else {
            console.log(`[${room.id}] No existing document found, creating new document`);
            ensureSharedStructures(doc);
          }

          // Return the Yjs document to y-partykit to manage
          ensureSharedStructures(doc);
          pruneChatHistory(doc);
          return doc;
        } catch (err) {
          console.error(`[${room.id}] Load failed:`, err);
          throw err;
        }
      },
      callback: {
        handler: async doc => {
          // This is called every few seconds if the document has changed

          // convert the Yjs document to a Uint8Array
          try {
            pruneChatHistory(doc);
            const content = Y.encodeStateAsUpdate(doc);

            // Save the document to the database
            const {data: _data, error} = await upsertDocument(room.id, content);
            if (error) {
              console.error(`[${room.id}] Failed to save:`, error);
              throw new Error(`Failed to save into database: ${error.message}`);
            }
          } catch (err) {
            console.error(`[${room.id}] Save error: `, err);
          }
        },
      },
    });
  }
}
