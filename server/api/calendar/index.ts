import { defineEventHandler, readBody, getQuery, createError } from 'h3';
import { db } from '~/server/database';
import { calendarEvents, users } from '~/server/database/schema';
import { eq, and, getTableColumns } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
    const method = event.node.req.method;

    if (method === 'GET') {
        const events = await db.select({
            id: calendarEvents.id,
            title: calendarEvents.title,
            description: calendarEvents.description,
            startTime: calendarEvents.startTime,
            endTime: calendarEvents.endTime,
            type: calendarEvents.type,
            userId: calendarEvents.userId,
            bierwartOverrideId: calendarEvents.bierwartOverrideId,
            isTentative: calendarEvents.isTentative,
            ownerName: users.name
        })
            .from(calendarEvents)
            .leftJoin(users, eq(calendarEvents.userId, users.id));

        return events;
    }

    if (method === 'POST') {
        const body = await readBody(event);
        if (!body.title || !body.startTime || !body.endTime) {
            throw createError({ statusCode: 400, message: 'Missing required fields' });
        }

        await db.insert(calendarEvents).values({
            title: body.title,
            description: body.description || null,
            startTime: new Date(body.startTime).getTime(),
            endTime: new Date(body.endTime).getTime(),
            type: body.type || 'rehearsal',
            userId: body.userId || null,
            isTentative: body.isTentative || false,
        });

        return { success: true };
    }

    if (method === 'PUT') {
        const body = await readBody(event);
        if (!body.id) {
            throw createError({ statusCode: 400, message: 'Missing ID' });
        }

        const updates: any = {};
        if (body.title) updates.title = body.title;
        if (body.description !== undefined) updates.description = body.description;
        if (body.startTime) updates.startTime = new Date(body.startTime).getTime();
        if (body.endTime) updates.endTime = new Date(body.endTime).getTime();
        if (body.type) updates.type = body.type;
        if (body.userId !== undefined) updates.userId = body.userId;
        if (body.bierwartOverrideId !== undefined) updates.bierwartOverrideId = body.bierwartOverrideId;
        if (body.isTentative !== undefined) updates.isTentative = body.isTentative;

        await db.update(calendarEvents)
            .set(updates)
            .where(eq(calendarEvents.id, body.id));

        return { success: true };
    }

    if (method === 'DELETE') {
        const query = getQuery(event);
        if (!query.id) {
            throw createError({ statusCode: 400, message: 'Missing ID' });
        }

        await db.delete(calendarEvents).where(eq(calendarEvents.id, Number(query.id)));
        return { success: true };
    }
});
