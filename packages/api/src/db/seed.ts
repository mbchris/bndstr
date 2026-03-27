import { and, eq } from 'drizzle-orm'
import { db } from './index.js'
import { bandMembers, bands, calendarEvents, songs, users } from './schema.js'

const BAND_NAME = 'Bndstr Demo Band'
const BAND_SLUG = 'bndstr-demo'

const bandUsers = [
  { id: 'seed-user-chris', name: 'schneider.chris', email: 'schneider.chris@gmx.de', role: 'admin', sortOrder: 0 },
  { id: 'seed-user-andre', name: 'Andre', email: 'andre@gmx.de', role: 'member', sortOrder: 1 },
  { id: 'seed-user-stefan', name: 'Stefan', email: 'stefan@gmx.de', role: 'member', sortOrder: 2 },
  { id: 'seed-user-andreas', name: 'Andreas', email: 'andreas@gmx.de', role: 'member', sortOrder: 3 },
  { id: 'seed-user-daniel', name: 'Daniel', email: 'daniel@gmx.de', role: 'member', sortOrder: 4 },
] as const

const setlistSongs = [
  ['Holiday', 'Green Day', 'https://open.spotify.com/intl-de/track/5vfjUAhefN7IjHbTvVCT4Z?si=4ab5dfb87a1d44cd'],
  ['Schrei nach Liebe', 'Die Ärzte', 'https://open.spotify.com/intl-de/track/4P4PHxZQ1FcwQKKnfEPsAZ?si=68958f13905f4bca'],
  ['Bad Guy', 'The Interrupters', 'https://open.spotify.com/intl-de/track/0iM1Ioz4N4p7MU1DKyqsov?si=1982a2ec6d844df5'],
  ['Countdown to Insanity', 'H-Blockx', 'https://open.spotify.com/intl-de/track/2XNaKS5wO5rPdgpPYVKria?si=f2c3a6dc0d144782'],
  ['Down in the past', 'Mando Diao', 'https://open.spotify.com/intl-de/track/2vx5Dc3Zxtd5yGDlh2pAAz?si=c19e003366684d9b'],
  ['Last resort', 'Papa Roach', 'https://open.spotify.com/intl-de/track/5W8YXBz9MTIDyrpYaCg2Ky?si=3ae221d3b6234a7c'],
  ['Billy Jean', 'The Bates', 'https://open.spotify.com/intl-de/track/5RpBC0VsMMSRYJmSgUZqDu?si=6644d5bee27d45bb'],
  ['Wild World', 'Me first and the gimme gimmes', 'https://open.spotify.com/intl-de/track/73PzrTVxMl8kmoSvFYLpig?si=b50ba624beaa41d3'],
] as const

const votingSongs = [
  ['Californication', 'Red Hot Chili Peppers', 'https://open.spotify.com/intl-de/track/48UPSzbZjgc449aqz8bxox?si=4ef0218567534539'],
  ['Take me out', 'Franz Ferdinand', 'https://open.spotify.com/intl-de/track/20I8RduZC2PWMWTDCZuuAN?si=2ec0e818266942d2'],
  ['Das geht ab', 'Die Atzen', 'https://open.spotify.com/intl-de/track/2P2kgRRvHflstcRHWC6v8n?si=2af35687dbf24627'],
  ['Auf gute Freunde', 'Onkelz', 'https://open.spotify.com/intl-de/track/0oIVNEkOgvOU9yG9oW13xC?si=499a70e53db54846'],
] as const

function nextThursdayAt20(now = new Date()): Date {
  const d = new Date(now)
  d.setHours(20, 0, 0, 0)
  const day = d.getDay() // 0 Sun .. 6 Sat
  const daysUntilThursday = (4 - day + 7) % 7
  d.setDate(d.getDate() + (daysUntilThursday === 0 ? 7 : daysUntilThursday))
  return d
}

async function getOrCreateBand(): Promise<number> {
  const existing = await db.select().from(bands).where(eq(bands.slug, BAND_SLUG)).limit(1)
  if (existing[0]) return existing[0].id

  const inserted = await db.insert(bands).values({ name: BAND_NAME, slug: BAND_SLUG, plan: 'free' }).returning({ id: bands.id })
  return inserted[0].id
}

async function ensureUserId(seedUser: (typeof bandUsers)[number]): Promise<string> {
  const existingByEmail = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, seedUser.email))
    .limit(1)

  if (existingByEmail[0]) return existingByEmail[0].id

  const existingById = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, seedUser.id))
    .limit(1)

  if (existingById[0]) return existingById[0].id

  const now = new Date()
  await db.insert(users).values({
    id: seedUser.id,
    name: seedUser.name,
    email: seedUser.email,
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
  })

  return seedUser.id
}

async function seedUsersAndMemberships(bandId: number): Promise<string> {
  let ownerUserId: string = bandUsers[0].id
  for (const user of bandUsers) {
    const userId = await ensureUserId(user)
    if (user.sortOrder === 0) ownerUserId = userId

    await db
      .insert(bandMembers)
      .values({
        bandId,
        userId,
        role: user.role,
        sortOrder: user.sortOrder,
      })
      .onConflictDoNothing()
  }

  return ownerUserId
}

async function seedSongs(bandId: number, addedBy: string): Promise<void> {
  for (const [position, [title, artist, spotifyUrl]] of setlistSongs.entries()) {
    const existing = await db
      .select({ id: songs.id })
      .from(songs)
      .where(and(eq(songs.bandId, bandId), eq(songs.title, title), eq(songs.artist, artist)))
      .limit(1)

    if (existing.length === 0) {
      await db.insert(songs).values({
        bandId,
        title,
        artist,
        spotifyUrl,
        type: 'song',
        isSetlist: true,
        isPinned: false,
        position,
        pitch: 0,
        addedBy,
      })
    }
  }

  for (const [position, [title, artist, spotifyUrl]] of votingSongs.entries()) {
    const existing = await db
      .select({ id: songs.id })
      .from(songs)
      .where(and(eq(songs.bandId, bandId), eq(songs.title, title), eq(songs.artist, artist)))
      .limit(1)

    if (existing.length === 0) {
      await db.insert(songs).values({
        bandId,
        title,
        artist,
        spotifyUrl,
        type: 'song',
        isSetlist: false,
        isPinned: false,
        position,
        pitch: 0,
        addedBy,
      })
    }
  }
}

async function seedCalendar(bandId: number): Promise<void> {
  const firstThursday = nextThursdayAt20()

  for (let i = 0; i < 10; i++) {
    const start = new Date(firstThursday)
    start.setDate(firstThursday.getDate() + i * 7)
    const end = new Date(start)
    end.setHours(start.getHours() + 3)
    const title = `Bandprobe #${i + 1}`

    const existing = await db
      .select({ id: calendarEvents.id })
      .from(calendarEvents)
      .where(and(eq(calendarEvents.bandId, bandId), eq(calendarEvents.title, title), eq(calendarEvents.startTime, start)))
      .limit(1)

    if (existing.length === 0) {
      await db.insert(calendarEvents).values({
        bandId,
        title,
        description: 'Probe und Bierverkostung',
        startTime: start,
        endTime: end,
        type: 'rehearsal',
      })
    }
  }

  const now = Date.now()
  const gig1Date = new Date(now + 3 * 7 * 24 * 60 * 60 * 1000)
  gig1Date.setHours(19, 0, 0, 0)
  const gig2Date = new Date(now + 5 * 7 * 24 * 60 * 60 * 1000)
  gig2Date.setHours(21, 0, 0, 0)

  const gigs: Array<{ title: string; description: string; startTime: Date }> = [
    { title: 'Gartenhallenbad', description: 'Live Show', startTime: gig1Date },
    { title: 'Wrench Crew Party', description: 'Rock Night', startTime: gig2Date },
  ]

  for (const gig of gigs) {
    const existing = await db
      .select({ id: calendarEvents.id })
      .from(calendarEvents)
      .where(and(eq(calendarEvents.bandId, bandId), eq(calendarEvents.title, gig.title), eq(calendarEvents.startTime, gig.startTime)))
      .limit(1)

    if (existing.length === 0) {
      const endTime = new Date(gig.startTime.getTime() + 2 * 60 * 60 * 1000)
      await db.insert(calendarEvents).values({
        bandId,
        title: gig.title,
        description: gig.description,
        startTime: gig.startTime,
        endTime,
        type: 'gig',
      })
    }
  }
}

async function main(): Promise<void> {
  console.log('Starting database seed...')
  const bandId = await getOrCreateBand()
  const ownerUserId = await seedUsersAndMemberships(bandId)
  await seedSongs(bandId, ownerUserId)
  await seedCalendar(bandId)
  console.log(`Database seeding complete for band ${BAND_SLUG} (id=${bandId}).`)
}

main().catch((error: unknown) => {
  console.error('Database seed failed:', error)
  process.exit(1)
})
