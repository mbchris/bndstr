import { defineEventHandler, readBody, getQuery } from 'h3';
import { db } from '~/server/database';
import { users } from '~/server/database/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from '#auth';

export default defineEventHandler(async (event) => {
    const method = event.method;
    console.log('User index hit:', method, event.node.req.url);

    // Auth check: in a real app, only allow admins
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

    if (method === 'GET') {
        const allUsers = await db.select().from(users).orderBy(users.sortOrder);
        return allUsers;
    }

    if (method === 'POST') {
        if (currentUser.role !== 'admin') {
            event.node.res.statusCode = 403;
            return { error: 'Forbidden' };
        }

        const body = await readBody(event);
        if (!body.name || !body.email) {
            event.node.res.statusCode = 400;
            return { error: 'Name and email are required' };
        }
        const newUser = await db.insert(users).values({
            name: body.name,
            email: body.email,
            role: body.role || 'user',
            isHidden: !!body.isHidden,
            beerCount: Number(body.beerCount) || 0
        }).returning();
        return newUser[0];
    }

    if (method === 'DELETE') {
        if (currentUser.role !== 'admin') {
            event.node.res.statusCode = 403;
            return { error: 'Forbidden' };
        }

        const query = getQuery(event);
        if (query.id) {
            await db.delete(users).where(eq(users.id, Number(query.id)));
            return { success: true };
        }
        event.node.res.statusCode = 400;
        return { error: 'ID is required' };
    }
});
