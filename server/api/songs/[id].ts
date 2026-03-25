import { defineEventHandler, readBody } from 'h3';
import { db } from '~/server/database';
import { songs, votes, users } from '~/server/database/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from '#auth';

export default defineEventHandler(async (event) => {
    const id = parseInt(event.context.params?.id || '0', 10);
    if (!id) {
        event.node.res.statusCode = 400;
        return { error: 'Invalid ID' };
    }

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

    if (event.method === 'DELETE') {
        const song = await db.select().from(songs).where(eq(songs.id, id)).get();
        if (!song) {
            event.node.res.statusCode = 404;
            return { error: 'Song not found' };
        }

        // delete associated votes first
        await db.delete(votes).where(eq(votes.songId, id));
        // delete the song
        await db.delete(songs).where(eq(songs.id, id));

        return { success: true };
    }

    if (event.method === 'PUT') {
        const body = await readBody(event);
        const songToUpdate = await db.select().from(songs).where(eq(songs.id, id)).get();

        if (!songToUpdate) {
            event.node.res.statusCode = 404;
            return { error: 'Song not found' };
        }

        let thumbnailUrl = songToUpdate.thumbnailUrl;
        // Fetch metadata if URL changed OR if thumbnail is currently missing but URL exists
        const spotifyUrl = body.spotifyUrl !== undefined ? body.spotifyUrl : songToUpdate.spotifyUrl;
        const needsMetadata = (body.spotifyUrl !== undefined && body.spotifyUrl !== songToUpdate.spotifyUrl) || 
                              (spotifyUrl && !thumbnailUrl);

        if (needsMetadata && spotifyUrl) {
            const spotifyData = await fetchSpotifyMetadata(spotifyUrl);
            thumbnailUrl = spotifyData.thumbnail || thumbnailUrl;
            
            // Also update title/artist if they are currently generic/missing and we got new data
            if (spotifyData.title && (songToUpdate.title === 'Untitled' || !songToUpdate.title)) {
                songToUpdate.title = spotifyData.title;
            }
            if (spotifyData.artist && (songToUpdate.artist === 'Unknown Artist' || !songToUpdate.artist)) {
                songToUpdate.artist = spotifyData.artist;
            }
        }

        const updated = await db.update(songs).set({
            title: body.title !== undefined ? body.title : songToUpdate.title,
            artist: body.artist !== undefined ? body.artist : songToUpdate.artist,
            spotifyUrl: body.spotifyUrl !== undefined ? body.spotifyUrl : songToUpdate.spotifyUrl,
            youtubeUrl: body.youtubeUrl !== undefined ? body.youtubeUrl : songToUpdate.youtubeUrl,
            thumbnailUrl: thumbnailUrl,
            notes: body.notes !== undefined ? body.notes : songToUpdate.notes,
            type: body.type !== undefined ? body.type : songToUpdate.type,
            pitch: body.pitch !== undefined ? body.pitch : songToUpdate.pitch,
            isSetlist: body.isSetlist !== undefined ? body.isSetlist : songToUpdate.isSetlist,
            position: body.position !== undefined ? body.position : songToUpdate.position,
            isPinned: body.isPinned !== undefined ? body.isPinned : songToUpdate.isPinned,
        }).where(eq(songs.id, id)).returning();

        return updated[0];
    }
});
