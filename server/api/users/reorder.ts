import { defineEventHandler, readBody } from 'h3';
import { db } from '~/server/database';
import { users } from '~/server/database/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from '#auth';

export default defineEventHandler(async (event) => {
    // Auth check
    const session = await getServerSession(event);
    let currentUser = null;
    if (session?.user?.email) {
        currentUser = await db.select().from(users).where(eq(users.email, session.user.email)).get();
    }
    if (!currentUser && process.env.DEVMODE === 'true') {
        currentUser = await db.select().from(users).where(eq(users.email, 'chris@example.org')).get();
        if (!currentUser) currentUser = { id: 2, name: 'Chris', email: 'chris@example.org', role: 'admin' } as any;
    }

    if (!currentUser || currentUser.role !== 'admin') {
        event.node.res.statusCode = 401;
        return { error: 'Unauthorized. Admin required to reorder members.' };
    }

    if (event.method === 'PUT' || event.method === 'POST') {
        const body = await readBody(event);
        if (!Array.isArray(body)) {
            event.node.res.statusCode = 400;
            return { error: 'Expected an array of { id, sortOrder }' };
        }

        try {
            await db.transaction(async (tx) => {
                for (const item of body) {
                    if (item.id && typeof item.sortOrder === 'number') {
                        await tx.update(users)
                            .set({ sortOrder: item.sortOrder })
                            .where(eq(users.id, item.id));
                    }
                }
            });
            return { success: true };
        } catch (e) {
            console.error('Failed to reorder users:', e);
            event.node.res.statusCode = 500;
            return { error: 'Internal server error while reordering users' };
        }
    }
});
