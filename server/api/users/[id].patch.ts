import { defineEventHandler, readBody, createError } from 'h3';
import { db } from '~/server/database';
import { users } from '~/server/database/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from '#auth';

export default defineEventHandler(async (event) => {
    // Auth check: only allow admins update users
    const session = await getServerSession(event);
    let currentUser = null;
    if (session?.user?.email) {
        currentUser = await db.select().from(users).where(eq(users.email, session.user.email)).get();
    }
    
    // Dev mode bypass
    if (!currentUser && process.env.DEVMODE === 'true') {
        currentUser = await db.select().from(users).where(eq(users.email, 'chris@example.org')).get();
        if (!currentUser) currentUser = { id: 2, name: 'Chris', email: 'chris@example.org', role: 'admin' } as any;
    }

    if (!currentUser) {
        throw createError({
            statusCode: 403,
            message: 'Forbidden: Access denied',
        });
    }

    const log = (msg: string, data?: any) => {
        const ts = new Date().toISOString();
        console.log(`[${ts}] [USER-PATCH] ${msg}`, data || '');
    };

    const id = Number(event.context.params?.id);
    log('Request params:', event.context.params);
    
    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'User ID is required',
        });
    }

    // Only admins can update other users. Users can only update themselves.
    if (currentUser.role !== 'admin' && currentUser.id !== id) {
        throw createError({
            statusCode: 403,
            message: 'Forbidden: You can only update your own profile',
        });
    }

    const targetUser = await db.select().from(users).where(eq(users.id, id)).get();
    if (!targetUser) {
        throw createError({ statusCode: 404, message: 'User not found' });
    }

    const body = await readBody(event);
    log('PATCH body:', body);
    const updateData: any = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.isHidden !== undefined) updateData.isHidden = body.isHidden;
    if (body.beerCount !== undefined) updateData.beerCount = Number(body.beerCount);


    if (Object.keys(updateData).length === 0) {
        log('No changes provided');
        return { message: 'No changes provided' };
    }

    try {
        log('Updating database...', updateData);
        await db.update(users)
            .set(updateData)
            .where(eq(users.id, id));
        
        const updatedUser = await db.select().from(users).where(eq(users.id, id)).get();
        log('Update successful, new user state:', updatedUser);

        if (!updatedUser) {
            throw createError({
                statusCode: 404,
                message: 'User was not found after update',
            });
        }

        return updatedUser;
    } catch (e: any) {
        throw createError({
            statusCode: 500,
            message: e.message || 'Failed to update user',
        });
    }
});
