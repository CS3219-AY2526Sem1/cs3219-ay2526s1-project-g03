import type * as Party from 'partykit/server';
import {onConnect as y_onConnect} from 'y-partykit';
import {Buffer} from 'node:buffer';

import * as Y from 'yjs';
import {parseCookies} from '../utils/cookies.js';
import {verifyToken} from '../utils/jwt.js';
import {
  getDocument,
  upsertDocument,
  checkRoomExists,
  checkUserVerified,
  deleteRoom,
} from '../storage/db.js';

const CHAT_HISTORY_LIMIT = 500;

export function ensureSharedStructures(doc: Y.Doc) {
  doc.getText('codemirror');
  doc.getMap<string>('config');
  doc.getArray('chat');
  doc.getMap('execution');
  doc.getMap('submission');
}

export function pruneChatHistory(doc: Y.Doc) {
  const chatArray = doc.getArray('chat');
  if (chatArray.length <= CHAT_HISTORY_LIMIT) {
    return;
  }
  const excess = chatArray.length - CHAT_HISTORY_LIMIT;
  chatArray.delete(0, excess);
}

export default class YjsServer implements Party.Server {
  constructor(public room: Party.Room) {}

  static async onBeforeConnect(request: Party.Request, _lobby: Party.Lobby) {
    try {
      const cookieHeader = request.headers.get('cookie');

      const cookies = cookieHeader ? parseCookies(cookieHeader) : {};
      const accessToken = cookies['accessToken'];
      if (!accessToken) {
        console.error('No accessToken cookie found');
        return new Response('Bad Request: No access token', {status: 400});
      }

      const roomId = new URL(request.url).pathname.split('/').pop();

      if (!roomId) {
        console.error('Room ID is undefined');
        return new Response('Bad Request: Room ID missing', {status: 400});
      }
      const roomExists = await checkRoomExists(roomId);

      if (!roomExists) {
        console.error(`Room ${roomId} not found in active_rooms`);
        return new Response('Room not found', {status: 404});
      }

      request.headers.set('X-Access-Token', accessToken);

      return request;
    } catch (e) {
      console.error('Authentication error:', e);
      return new Response('Internal Server Error', {status: 500});
    }
  }

  async onConnect(connection: Party.Connection, ctx: Party.ConnectionContext) {
    try {
      const accessToken = ctx.request.headers.get('X-Access-Token');
      const roomId = this.room.id;
      if (!accessToken || !roomId) {
        console.error('Missing auth data in onConnect');
        connection.close(4000, 'Internal error: Missing authentication data');
        return;
      }
      const {valid, payload} = await verifyToken(accessToken);

      if (!valid || !payload) {
        console.error('Token verification failed:', payload);
        connection.close(4001, 'Unauthorised: Invalid or expired token');
        return;
      }

      const isUserVerified = await checkUserVerified(payload.userId.toString(), roomId);

      if (!isUserVerified) {
        console.error(`User ${payload.userId} not authorised to enter room ${roomId}`);
        connection.close(4003, 'Forbidden: You are not authorised for this room');
        return;
      }

      await y_onConnect(connection, this.room, {
        async load() {
          // This is called once per "room" when the first user connects

          // Creates the backend Yjs document
          const doc = new Y.Doc();

          // Load the document from the database
          try {
            const {data, error} = await getDocument(roomId);
            if (error) {
              throw new Error(error.message);
            }

            if (data) {
              try {
                const buffer = Buffer.from(data.document, 'base64');
                Y.applyUpdate(doc, new Uint8Array(buffer));
                ensureSharedStructures(doc);
                pruneChatHistory(doc);
              } catch (parseErr) {
                console.warn(`[${roomId}] Data corrupted, creating new document`);
              }
            } else {
              console.log(`[${roomId}] No existing document found, creating new document`);
              ensureSharedStructures(doc);
            }

            // Return the Yjs document to y-partykit to manage
            ensureSharedStructures(doc);
            pruneChatHistory(doc);
            return doc;
          } catch (err) {
            console.error(`[${roomId}] Load failed:`, err);
            throw err;
          }
        },
        callback: {
          handler: async doc => {
            try {
              pruneChatHistory(doc);
              const content = Y.encodeStateAsUpdate(doc);

              const {data: _data, error} = await upsertDocument(roomId, content);
              if (error) {
                console.error(`[${roomId}] Failed to save:`, error);
                throw new Error(`Failed to save into database: ${error.message}`);
              }
            } catch (err) {
              console.error(`[${roomId}] Save error: `, err);
            }
          },
        },
      });

      // Track when connection closes
      connection.addEventListener('close', async () => {
        // Wait a bit to ensure the connection is fully removed from room.connections
        // Then check if this was the last connection in the room
        setTimeout(async () => {
          const userCount = [...this.room.getConnections()].length;
          if (userCount === 0) {
            // All users have disconnected, delete the room
            console.log(`[${roomId}] All users disconnected, deleting room...`);
            try {
              const {error} = await deleteRoom(roomId);
              if (error) {
                console.error(`[${roomId}] Failed to delete room:`, error);
              } else {
                console.log(`[${roomId}] Room deleted successfully`);
              }
            } catch (err) {
              console.error(`[${roomId}] Error deleting room:`, err);
            }
          }
        }, 20000); // Delay to prevent initial connection to trigger this
      });
    } catch (e) {
      console.error('Connection error:', e);
      connection.close(4000, 'Internal server error');
    }
  }
}
