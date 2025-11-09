import * as Party from 'partykit/server';
import {createRoom, getActiveRoom} from '../storage/db.js';
import type {RoomSchema} from '../schema/roomSchema.js';

const createRoomHandler = async (req: Party.Request, room: Party.Room) => {
  try {
    const body = (await req.json()) as RoomSchema;
    const {data, error} = await createRoom(body);

    if (error) {
      return new Response(JSON.stringify({error: error.message}), {
        status: 400,
        headers: {'Content-Type': 'application/json'},
      });
    }

    return new Response(JSON.stringify({success: true, roomId: room.id, data}), {
      status: 201,
      headers: {'Content-Type': 'application/json'},
    });
  } catch (e) {
    return new Response(JSON.stringify({error: 'Failed to create room'}), {
      status: 500,
      headers: {'Content-Type': 'application/json'},
    });
  }
};

// GET - Get room information
const getRoomHandler = async (req: Party.Request, room: Party.Room) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
  try {
    let roomData = await room.storage.get('roomData');

    if (!roomData) {
      console.log(`[${room.id}] First connection - fetching room data`);
      const {data, error} = await getActiveRoom(room.id);
      if (error || !data) {
        return new Response(JSON.stringify({error: 'Room not found'}), {
          status: 404,
          headers: corsHeaders,
        });
      }
      room.storage.put('roomData', data);
      roomData = data;
    }

    return new Response(JSON.stringify(roomData), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (e) {
    return new Response(JSON.stringify({error: 'Failed to get room info'}), {
      status: 500,
      headers: corsHeaders,
    });
  }
};

export default class APIServer implements Party.Server {
  constructor(public room: Party.Room) {}

  static async onBeforeRequest(req: Party.Request) {
    //TODO: authenticate request (frontend for get/s2s authentication for post)
    return req;
  }

  async onRequest(req: Party.Request): Promise<Response> {
    const url = new URL(req.url);
    const expectedPath = `/parties/main/${this.room.id}`;

    // Validate URL path
    if (url.pathname !== expectedPath) {
      return new Response(JSON.stringify({error: 'Invalid URL path'}), {
        status: 404,
        headers: {'Content-Type': 'application/json'},
      });
    }

    if (req.method === 'GET') {
      console.log(this.room.id);
      return await getRoomHandler(req, this.room);
    }

    if (req.method === 'POST') {
      return await createRoomHandler(req, this.room);
    }

    return new Response('Request method not allowed', {status: 405});
  }
}
