import { defineEventHandler, readBody, getRouterParam } from 'h3';
import { db } from '~/server/database';
import { gigSongs } from '~/server/database/schema';
import { eq, and } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
    const gigIdStr = getRouterParam(event, 'id');
    const gigId = parseInt(gigIdStr || '0', 10);
    const updates = await readBody(event) as { id: number, position: number }[];

    if (isNaN(gigId) || !Array.isArray(updates)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid input' });
    }

    try {
        await db.transaction(async (tx) => {
            for (const update of updates) {
                await tx.update(gigSongs)
                    .set({ position: update.position })
                    .where(and(eq(gigSongs.gigId, gigId), eq(gigSongs.songId, update.id)));
            }
        });
        return { success: true };
    } catch (e: any) {
        throw createError({ statusCode: 500, statusMessage: e.message });
    }
});
