import { defineEventHandler } from 'h3';
import { db } from '~/server/database';
import { users, calendarEvents, songs, rehearsalSongs } from '~/server/database/schema';

export default defineEventHandler(async (event) => {
    // Only allow in development or provide some secret key for production 
    // but for now we'll just implement it as an init script

    // Add users: André, Chris, Stefan, Daniel, Andreas
    const members = [
        { name: 'André', email: 'andre@example.org', role: 'admin' },
        { name: 'Chris', email: 'chris@example.org', role: 'admin' },
        { name: 'Stefan', email: 'stefan@example.org', role: 'member' },
        { name: 'Daniel', email: 'daniel@example.org', role: 'member' },
        { name: 'Andreas', email: 'andreas@example.org', role: 'member' },
    ];

    try {
        for (const member of members) {
            await db.insert(users).values(member).onConflictDoNothing();
        }
    } catch (e) {
        console.error('Error inserting users', e);
    }

    // Check if there's any calendar event
    const allEvents = await db.select().from(calendarEvents);
    if (allEvents.length === 0) {
        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const insertRehearsals = await db.insert(calendarEvents).values({
            startTime: nextWeek,
            endTime: new Date(nextWeek.getTime() + 2 * 60 * 60 * 1000),
            type: 'rehearsal',
            title: 'Rehearsal',
            description: 'New Songs and setlist preparation'
        }).returning();

        // Maybe add some dummy songs
        if (insertRehearsals.length > 0) {
            const rehearsalId = insertRehearsals[0].id;
            const newSongs = await db.insert(songs).values([
                { title: 'Learn to Fly', artist: 'Foo Fighters', addedBy: 1 },
                { title: 'Basket Case', artist: 'Green Day', addedBy: 2 },
                { title: 'The Pretender', artist: 'Foo Fighters', addedBy: 1 },
            ]).returning();

            for (const song of newSongs) {
                await db.insert(rehearsalSongs).values({
                    rehearsalId,
                    songId: song.id,
                });
            }
        }
    }

    return { success: true, message: 'Database initialized successfully with band members and some sample data.' };
});
