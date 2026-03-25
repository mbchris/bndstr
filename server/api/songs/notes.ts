import { defineEventHandler, readBody, getQuery, createError } from 'h3';
import { db } from '~/server/database';
import { personalNotes, users } from '~/server/database/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from '#auth';

export default defineEventHandler(async (event) => {
    const session = await getServerSession(event);
    let currentUser = null;
    if (session?.user?.email) {
        currentUser = await db.select().from(users).where(eq(users.email, session.user.email)).get();
    }
    
    // Fallback for development if not logged in
    if (!currentUser && process.env.DEVMODE === 'true') {
        const adminUser = await db.select().from(users).where(eq(users.role, 'admin')).get();
        currentUser = adminUser || { id: 1, name: 'Dev', email: 'dev@example.org', role: 'admin' };
    }

    if (!currentUser) {
        throw createError({ statusCode: 401, message: 'Unauthorized' });
    }

    const method = event.method;

    if (method === 'GET') {
        const query = getQuery(event);
        const songId = query.songId ? Number(query.songId) : null;

        if (songId) {
            const note = await db.select()
                .from(personalNotes)
                .where(and(
                    eq(personalNotes.songId, songId),
                    eq(personalNotes.userId, currentUser.id)
                ))
                .get();
            return note || { content: '' };
        }

        const notes = await db.select()
            .from(personalNotes)
            .where(eq(personalNotes.userId, currentUser.id));
        return notes;
    }

    if (method === 'POST') {
        const body = await readBody(event);
        if (!body.songId) {
            throw createError({ statusCode: 400, message: 'Missing songId' });
        }

        const content = body.content || '';

        // Upsert logic
        const existing = await db.select()
            .from(personalNotes)
            .where(and(
                eq(personalNotes.songId, body.songId),
                eq(personalNotes.userId, currentUser.id)
            ))
            .get();

        if (existing) {
            await db.update(personalNotes)
                .set({ content, createdAt: new Date() })
                .where(eq(personalNotes.id, existing.id));
        } else {
            await db.insert(personalNotes).values({
                songId: body.songId,
                userId: currentUser.id,
                content,
                createdAt: new Date()
            });
        }

        return { success: true };
    }
});
