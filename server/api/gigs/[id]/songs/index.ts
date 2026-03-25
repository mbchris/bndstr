import { defineEventHandler, readBody, getRouterParam } from 'h3';
import { db } from '~/server/database';
import { songs, gigSongs } from '~/server/database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
    const method = event.method;
    const gigIdStr = getRouterParam(event, 'id');
    const gigId = parseInt(gigIdStr || '0', 10);

    if (isNaN(gigId) || gigId <= 0) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid gig ID' });
    }

    if (method === 'GET') {
        try {
            // Join gigSongs and songs. Map it so the UI can use it just like regular songs
            const rawGigSongs = await db.select({
                id: songs.id,
                gigSongId: gigSongs.id,
                position: gigSongs.position,
                title: songs.title,
                artist: songs.artist,
                spotifyUrl: songs.spotifyUrl,
                youtubeUrl: songs.youtubeUrl,
                thumbnailUrl: songs.thumbnailUrl,
                notes: songs.notes,
                type: songs.type,
                pitch: songs.pitch,
                isPinned: songs.isPinned,
                isSetlist: songs.isSetlist
            }).from(gigSongs)
              .innerJoin(songs, eq(gigSongs.songId, songs.id))
              .where(eq(gigSongs.gigId, gigId))
              .orderBy(gigSongs.position);

            return rawGigSongs;
        } catch (e: any) {
            console.error('[GIG-SONGS-GET-ERROR]', e);
            throw createError({ statusCode: 500, statusMessage: e.message });
        }
    }

    if (method === 'POST') {
        const body = await readBody(event);
        try {
            const newGigSong = await db.insert(gigSongs).values({
                gigId: gigId,
                songId: body.songId,
                position: body.position || 0
            }).returning();
            return newGigSong[0];
        } catch (e: any) {
            console.error('[GIG-SONGS-POST-ERROR]', e);
            throw createError({ statusCode: 500, statusMessage: e.message });
        }
    }
});
