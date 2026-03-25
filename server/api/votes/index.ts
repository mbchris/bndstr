import { defineEventHandler, readBody } from 'h3';
import { db } from '~/server/database';
import { votes, users } from '~/server/database/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from '#auth';

export default defineEventHandler(async (event) => {
    if (event.method !== 'POST') {
        event.node.res.statusCode = 405;
        return { error: 'Method not allowed' };
    }

    const session = await getServerSession(event);
    let currentUser = null;
    if (session?.user?.email) {
        currentUser = await db.select().from(users).where(eq(users.email, session.user.email)).get();
    }
    if (!currentUser && process.env.DEVMODE === 'true') {
        currentUser = await db.select().from(users).where(eq(users.email, 'chris@example.org')).get();
        if (!currentUser) currentUser = { id: 2, name: 'Chris', email: 'chris@example.org', role: 'admin' } as any;
    }

    if (!currentUser || currentUser.isHidden) {
        event.node.res.statusCode = 401;
        return { error: currentUser?.isHidden ? 'Hidden users cannot vote' : 'Unauthorized' };
    }

    const body = await readBody(event);
    const { songId, comment, score, remove } = body;

    if (!songId) {
        event.node.res.statusCode = 400;
        return { error: 'songId is required' };
    }

    const existingVote = await db.select().from(votes).where(and(eq(votes.songId, songId), eq(votes.userId, currentUser.id))).get();

    if (remove) {
        if (existingVote) {
            await db.delete(votes).where(eq(votes.id, existingVote.id));
        }
        return { success: true, action: 'removed' };
    } else {
        if (existingVote) {
            await db.update(votes).set({ comment, score: score !== undefined ? score : existingVote.score }).where(eq(votes.id, existingVote.id));
            return { success: true, action: 'updated' };
        } else {
            if (score === undefined) {
                event.node.res.statusCode = 400;
                return { error: 'score is required for new votes' };
            }
            await db.insert(votes).values({ songId, userId: currentUser.id, score, comment });
            return { success: true, action: 'added' };
        }
    }
});
