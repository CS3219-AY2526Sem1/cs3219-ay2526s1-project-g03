import {createClient} from '@supabase/supabase-js';
import {SUPABASE_URL, SUPABASE_KEY} from '../config/config.js';
import type {RoomSchema} from '../schema/roomSchema.js';
import {Buffer} from 'node:buffer';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {persistSession: false},
});

export async function getDocument(roomId: string) {
  return await supabase.from('documents').select('document').eq('name', roomId).maybeSingle();
}

export async function upsertDocument(roomId: string, content: Uint8Array<ArrayBufferLike>) {
  return await supabase.from('documents').upsert(
    {
      name: roomId,
      document: Buffer.from(content).toString('base64'),
    },
    {onConflict: 'name'}
  );
}

export async function createRoom(room: RoomSchema) {
  return await supabase.from('active_rooms').upsert(room);
}

export async function getActiveRoom(roomId: string) {
  return await supabase.from('active_rooms').select('*').eq('id', roomId).single();
}

export async function checkRoomExists(roomId: string): Promise<boolean> {
  const {data, error} = await supabase.from('active_rooms').select('id').eq('id', roomId).single();

  return !error && data !== null;
}

export async function checkUserVerified(userId: string, roomId: string): Promise<boolean> {
  const {data, error} = await supabase
    .from('active_rooms')
    .select('id')
    .eq('id', roomId)
    .or(`user1.eq.${userId},user2.eq.${userId}`)
    .maybeSingle();

  return !error && data !== null;
}

export async function deleteRoom(roomId: string) {
  const result = await supabase.from('active_rooms').delete().eq('id', roomId);

  // Log deletion result for debugging
  if (result.error) {
    console.error(`[deleteRoom] Error deleting room ${roomId}:`, result.error);
  } else {
    console.log(`[deleteRoom] Room ${roomId} deleted. Rows affected:`, result);
  }

  return result;
}
