import { defineEventHandler, getQuery, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const spotifyUrl = query.url as string

  if (!spotifyUrl || !spotifyUrl.includes('spotify.com')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid or missing Spotify URL',
    })
  }

  try {
    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`
    console.log(`[Spotify Lookup Proxy] Fetching: ${oembedUrl}`)
    
    // We use Nuxt's built-in $fetch which works great for server-side proxying
    const data = await $fetch(oembedUrl, {
      headers: {
        'User-Agent': 'bndstr-band-app/1.0'
      }
    })
    return data
  } catch (err: any) {
    console.error(`[Spotify Lookup Proxy] Failed for ${spotifyUrl}:`, err.message)
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: 'Failed to fetch Spotify metadata',
    })
  }
})
