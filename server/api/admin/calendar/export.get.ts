import { defineEventHandler, createError } from 'h3';
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

    const events = await db.select().from(calendarEvents);

    event.node.res.setHeader('Content-Type', 'application/json; charset=utf-8');
    event.node.res.setHeader('Content-Disposition', 'attachment; filename="calendar_export.json"');
    
    return JSON.stringify(events, null, 2);
});
