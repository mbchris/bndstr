import { defineEventHandler, readMultipartFormData, createError } from 'h3';
import { db } from '~/server/database';
import { calendarEvents, users } from '~/server/database/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from '#auth';

export default defineEventHandler(async (event) => {
    // Auth check: Admin only
    const session = await getServerSession(event);
    let currentUser = null;
    if (session?.user?.email) {
        currentUser = await db.select().from(users).where(eq(users.email, session.user.email)).get();
    }
    if (!currentUser || currentUser.role !== 'admin') {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
    }

    const files = await readMultipartFormData(event);
    if (!files || !files.length || !files[0].data) {
        throw createError({ statusCode: 400, statusMessage: 'No file uploaded' });
    }

    const jsonContent = files[0].data.toString('utf-8');
    let data;
    try {
        data = JSON.parse(jsonContent);
    } catch (e) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid JSON file' });
    }

    if (!Array.isArray(data)) {
        throw createError({ statusCode: 400, statusMessage: 'Expected JSON array' });
    }

    for (const entry of data) {
        if (!entry.title || !entry.startTime) continue;

        // Construct object, normalizing dates and IDs
        const values = {
            title: entry.title,
            type: entry.type || 'rehearsal',
            startTime: typeof entry.startTime === 'number' ? entry.startTime : (new Date(entry.startTime).getTime() || Date.now()),
            endTime: entry.endTime ? (typeof entry.endTime === 'number' ? entry.endTime : (new Date(entry.endTime).getTime() || Date.now() + 7200000)) : (new Date(entry.startTime).getTime() + 7200000),
            description: entry.description || null,
            userId: entry.userId ? parseInt(entry.userId) : null,
            bierwartOverrideId: entry.bierwartOverrideId ? parseInt(entry.bierwartOverrideId) : null,
            created_at: entry.created_at || Date.now()
        };

        await db.insert(calendarEvents).values(values);
    }

    return { success: true, count: data.length };
});
