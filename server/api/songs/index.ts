import { defineEventHandler, readBody } from 'h3';
import { db } from '~/server/database';
import { songs, votes, users } from '~/server/database/schema';
import { eq, sql, and } from 'drizzle-orm';
import { getServerSession } from '#auth';
import { fetchSpotifyMetadata } from '~/server/utils/spotify';

export default defineEventHandler(async (event): Promise<any> => {
    const method = event.method;
    const session = await getServerSession(event);

    let currentUser = null;
    if (session?.user?.email) {
        currentUser = await db.select().from(users).where(eq(users.email, session.user.email)).get();
    }

    if (!currentUser && process.env.DEVMODE === 'true') {
        currentUser = await db.select().from(users).where(eq(users.email, 'chris@example.org')).get();
        if (!currentUser) currentUser = { id: 2, name: 'Chris', email: 'chris@example.org', role: 'admin' } as any;
    }

    if (method === 'GET') {
        try {
            // First get all songs
            const rawSongs = await db.select().from(songs).orderBy(songs.position);
            // Then get all votes
            const allVotesList = await db.select().from(votes);

            return rawSongs.map(song => {
                const songVotes = allVotesList.filter(v => v.songId === song.id);
                const currentUserVote = songVotes.find(v => v.userId === (currentUser?.id || -1));

                return {
                    ...song,
                    voteCount: songVotes.length,
                    voteAverage: songVotes.length > 0 
                        ? songVotes.reduce((acc, v) => acc + (v.score || 0), 0) / songVotes.length 
                        : 0,
                    hasVoted: currentUserVote ? currentUserVote.score : -1,
                    allVotes: songVotes.filter(v => v.userId !== null)
                };
            }).filter(s => (event.node.req.url?.includes('voting') ? !s.isSetlist : true)) // Optional filter if called from voting page
            .sort((a,b) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return (a.position - b.position) || (b.voteAverage - a.voteAverage);
            });
        } catch (e: any) {
            console.error('[SONGS-GET-SIMPLIFIED-ERROR]', e);
            throw createError({ statusCode: 500, statusMessage: e.message });
        }
    }

    if (method === 'POST') {
        if (!currentUser) {
            event.node.res.statusCode = 401;
            return { error: 'Unauthorized' };
        }

        const body = await readBody(event);
        const type = body.type || 'song';
        if (type === 'song' && !body.spotifyUrl) {
            event.node.res.statusCode = 400;
            return { error: 'Spotify URL is required for songs' };
        }

        const spotifyData = type === 'song' ? await fetchSpotifyMetadata(body.spotifyUrl) : { title: body.title, artist: body.artist, thumbnail: null };

        const newSong = await db.insert(songs).values({
            title: body.title || spotifyData.title || 'Untitled',
            artist: body.artist || spotifyData.artist || 'Unknown Artist',
            spotifyUrl: body.spotifyUrl,
            youtubeUrl: body.youtubeUrl,
            notes: body.notes,
            type: body.type || 'song',
            pitch: body.pitch || 0,
            isSetlist: body.isSetlist || false,
            position: body.position || 0,
            isPinned: body.isPinned || false,
            thumbnailUrl: spotifyData.thumbnail || null,
            addedBy: currentUser.id
        }).returning();

        return newSong[0];
    }
});
