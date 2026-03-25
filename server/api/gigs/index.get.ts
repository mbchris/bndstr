import { defineEventHandler } from 'h3';
import { db } from '~/server/database';
import { calendarEvents } from '~/server/database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
    return await db.select().from(calendarEvents).where(eq(calendarEvents.type, 'gig')).orderBy(calendarEvents.startTime);
});
