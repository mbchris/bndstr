import { defineEventHandler } from 'h3';
import { db } from '~/server/database';
import { calendarEvents, rehearsalSongs, songs, users } from '~/server/database/schema';
import { eq, gte, and, lte } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
    const now = Date.now();

    // Get the next upcoming rehearsal
    const nextRehearsal = await db.select()
        .from(calendarEvents)
        .where(and(
            eq(calendarEvents.type, 'rehearsal'),
            gte(calendarEvents.startTime, now)
        ))
        .orderBy(calendarEvents.startTime)
        .limit(1)
        .get();

    // Get upcoming gigs
    const upcomingGigs = await db.select()
        .from(calendarEvents)
        .where(and(
            eq(calendarEvents.type, 'gig'),
            gte(calendarEvents.startTime, now)
        ))
        .orderBy(calendarEvents.startTime)
        .limit(3);

    if (!nextRehearsal) return { nextRehearsal: null, upcomingGigs };

    // Fetch unavailabilities for the SAME day as the next rehearsal
    const dayStart = new Date(nextRehearsal.startTime);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const unavailabilities = await db.select({
        id: calendarEvents.id,
        title: calendarEvents.title,
        userName: users.name
    })
    .from(calendarEvents)
    .innerJoin(users, eq(calendarEvents.userId, users.id))
    .where(and(
        eq(calendarEvents.type, 'unavailability'),
        eq(users.isHidden, false),
        lte(calendarEvents.startTime, dayEnd.getTime()),
        gte(calendarEvents.endTime, dayStart.getTime())
    ));

    // Get the songs
    const songsData = await db.select({
        id: songs.id,
        title: songs.title,
        artist: songs.artist,
        spotifyUrl: songs.spotifyUrl,
        youtubeUrl: songs.youtubeUrl,
        notes: songs.notes
    })
        .from(rehearsalSongs)
        .innerJoin(songs, eq(rehearsalSongs.songId, songs.id))
        .where(eq(rehearsalSongs.rehearsalId, nextRehearsal.id));

    return {
        nextRehearsal: {
            ...nextRehearsal,
            songs: songsData,
            unavailabilities
        },
        upcomingGigs
    };
});
