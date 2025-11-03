import type * as Party from 'partykit/server';
import {onConnect as y_onConnect} from 'y-partykit';

import {createClient} from '@supabase/supabase-js';
import {Buffer} from 'node:buffer';

import * as Y from 'yjs';

// TODO : separate database connection
// Create a single supabase client for interacting with your database
const SUPABASE_URL = process.env['SUPABASE_URL'] as string;
const SUPABASE_KEY = process.env['SUPABASE_KEY'] as string;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('FATAL ERROR: Missing required environment variables');
  console.error('Required: SUPABASE_URL, SUPABASE_KEY');
  console.error('Please check your .env file');
  throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_KEY');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {persistSession: false}
});

export default class YjsServer implements Party.Server {
  constructor(public room: Party.Room) {}
  
  async onRequest(request: Party.Request) {
    // CORS headers for frontend access
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };

    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      return new Response(null, {status: 204, headers: corsHeaders});
    }

    if (request.method === 'GET') {
      try {
        const {data, error} = await supabase
          .from('documents')
          .select('created_at')
          .eq('name', this.room.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "not found" error, which is okay
          console.error(`[${this.room.id}] Failed to fetch timestamp:`, error);
          return new Response(
            JSON.stringify({
              error: 'Failed to fetch room timestamp',
            }),
            {status: 500, headers: corsHeaders}
          );
        }

        return new Response(
          JSON.stringify({
            roomId: this.room.id,
            createdAt: data?.created_at || new Date().toISOString(),
          }),
          {status: 200, headers: corsHeaders}
        );
      } catch (err) {
        console.error(`[${this.room.id}] Request error:`, err);
        return new Response(
          JSON.stringify({
            error: 'Internal server error',
          }),
          {status: 500, headers: corsHeaders}
        );
      }
    }

    return new Response('Method not allowed', {status: 405, headers: corsHeaders});
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
          const {data, error} = await supabase
            .from('documents')
            .select('document')
            .eq('name', room.id)
            .maybeSingle();

          if (error) {
            throw new Error(error.message);
          }

          if (data) {
            // If the document exists on the database,
            // apply it to the Yjs document
            try {
              const buffer = Buffer.from(data.document, 'base64');
              Y.applyUpdate(doc, new Uint8Array(buffer));
            } catch (parseErr) {
              console.warn(`[${room.id}] Data corrupted, creating new document`);
            }
          } else {
            console.log(`[${room.id}] No existing document found, creating new document`);
          }

          // Return the Yjs document to y-partykit to manage
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
            const content = Y.encodeStateAsUpdate(doc);

            // Save the document to the database
            const {data: _data, error} = await supabase.from('documents').upsert(
              {
                name: room.id,
                document: Buffer.from(content).toString('base64'),
              },
              {onConflict: 'name'}
            );

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
