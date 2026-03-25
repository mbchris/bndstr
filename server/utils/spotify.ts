export async function fetchSpotifyMetadata(url: string) {
    if (!url || !url.includes('spotify.com')) return { title: null, artist: null, thumbnail: null };
    
    try {
        // Spotify oEmbed API - public, no token needed
        const data = await $fetch<any>(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`);
        
        return {
            title: data.title || null,
            artist: data.author_name || null,
            thumbnail: data.thumbnail_url || null
        };
    } catch (e) {
        console.warn(`[SPOTIFY] Failed to fetch metadata for ${url}:`, e);
        return { title: null, artist: null, thumbnail: null };
    }
}
