import { defineEventHandler, getRouterParam } from 'h3';
import { db } from '~/server/database';
import { gigSongs, songs } from '~/server/database/schema';
import { eq, and } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
    const gigIdStr = getRouterParam(event, 'id');
    const gigId = parseInt(gigIdStr || '0', 10);
    const songIdStr = getRouterParam(event, 'songId');
    const songId = parseInt(songIdStr || '0', 10);

    if (isNaN(gigId) || isNaN(songId)) throw createError({ statusCode: 400, statusMessage: 'Invalid ID' });

    try {
        const gigSongRecord = await db.select().from(gigSongs)
            .where(and(eq(gigSongs.gigId, gigId), eq(gigSongs.songId, songId)))
            .limit(1)
            .get();

        if (gigSongRecord) {
            await db.delete(gigSongs).where(eq(gigSongs.id, gigSongRecord.id));
        }

        const songRecord = await db.select().from(songs).where(eq(songs.id, songId)).get();
        if (songRecord && (songRecord.type === 'pause' || songRecord.type === 'tuning')) {
            await db.delete(songs).where(eq(songs.id, songId));
        }

        return { success: true };
    } catch (e: any) {
        throw createError({ statusCode: 500, statusMessage: e.message });
    }
});
