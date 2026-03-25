import { defineEventHandler, readBody } from 'h3';
import { db } from '~/server/database';
import { songs, users } from '~/server/database/schema';
import { eq } from 'drizzle-orm';
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

    if (!currentUser) {
        event.node.res.statusCode = 401;
        return { error: 'Unauthorized' };
    }

    const updates: { id: number, position: number }[] = await readBody(event);
    if (!Array.isArray(updates)) {
        event.node.res.statusCode = 400;
        return { error: 'Expected an array of { id, position } objects' };
    }

    // Process bulk updates synchronously (sufficient for small datasets in SQLite)
    for (const item of updates) {
        if (typeof item.id === 'number' && typeof item.position === 'number') {
            await db.update(songs)
                .set({ position: item.position })
                .where(eq(songs.id, item.id));
        }
    }

    return { success: true, count: updates.length };
});
