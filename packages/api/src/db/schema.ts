import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  serial,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─── Multi-tenancy core ──────────────────────────────────────────────────────

export const bands = pgTable('bands', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  plan: text('plan').notNull().default('free'), // 'free' | 'band' | 'pro'
  stripeCustomerId: text('stripe_customer_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const bandMembers = pgTable(
  'band_members',
  {
    bandId: integer('band_id')
      .notNull()
      .references(() => bands.id, { onDelete: 'cascade' }),
    userId: text('user_id') // Better Auth user id (text/uuid)
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('member'), // 'owner' | 'admin' | 'member'
    sortOrder: integer('sort_order').notNull().default(0),
    isHidden: boolean('is_hidden').notNull().default(false),
    beerCount: integer('beer_count').notNull().default(0),
    joinedAt: timestamp('joined_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('band_members_band_user_idx').on(t.bandId, t.userId),
    index('band_members_band_idx').on(t.bandId),
  ],
)

// ─── Auth (managed by Better Auth, but declared for relations) ───────────────

export const users = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Songs ───────────────────────────────────────────────────────────────────

export const songs = pgTable(
  'songs',
  {
    id: serial('id').primaryKey(),
    bandId: integer('band_id')
      .notNull()
      .references(() => bands.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    artist: text('artist').notNull(),
    spotifyUrl: text('spotify_url'),
    youtubeUrl: text('youtube_url'),
    thumbnailUrl: text('thumbnail_url'),
    notes: text('notes'),
    type: text('type').notNull().default('song'), // 'song' | 'pause' | 'tuning'
    pitch: integer('pitch').notNull().default(0), // -5 to +5
    isSetlist: boolean('is_setlist').notNull().default(false),
    position: integer('position').notNull().default(0),
    isPinned: boolean('is_pinned').notNull().default(false),
    addedBy: text('added_by').references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('songs_band_idx').on(t.bandId, t.position),
  ],
)

// ─── Votes ───────────────────────────────────────────────────────────────────

export const votes = pgTable(
  'votes',
  {
    id: serial('id').primaryKey(),
    bandId: integer('band_id')
      .notNull()
      .references(() => bands.id, { onDelete: 'cascade' }),
    songId: integer('song_id')
      .notNull()
      .references(() => songs.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    score: integer('score').notNull().default(0), // 0=veto, 1=ok, 2=good, 3=great
    comment: text('comment'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('votes_song_user_idx').on(t.songId, t.userId),
    index('votes_band_idx').on(t.bandId),
  ],
)

// ─── Calendar ────────────────────────────────────────────────────────────────

export const calendarEvents = pgTable(
  'calendar_events',
  {
    id: serial('id').primaryKey(),
    bandId: integer('band_id')
      .notNull()
      .references(() => bands.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    startTime: timestamp('start_time').notNull(),
    endTime: timestamp('end_time').notNull(),
    type: text('type').notNull().default('rehearsal'), // 'rehearsal' | 'gig' | 'event' | 'unavailability'
    userId: text('user_id').references(() => users.id), // for unavailabilities
    bierwartOverrideId: text('bierwart_override_id').references(() => users.id),
    isTentative: boolean('is_tentative').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('calendar_band_idx').on(t.bandId, t.startTime),
  ],
)

// ─── Personal notes ──────────────────────────────────────────────────────────

export const personalNotes = pgTable(
  'personal_notes',
  {
    id: serial('id').primaryKey(),
    bandId: integer('band_id')
      .notNull()
      .references(() => bands.id, { onDelete: 'cascade' }),
    songId: integer('song_id')
      .notNull()
      .references(() => songs.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('personal_notes_song_user_idx').on(t.songId, t.userId),
  ],
)

// ─── Rehearsal songs (junction) ──────────────────────────────────────────────

export const rehearsalSongs = pgTable(
  'rehearsal_songs',
  {
    bandId: integer('band_id')
      .notNull()
      .references(() => bands.id, { onDelete: 'cascade' }),
    rehearsalId: integer('rehearsal_id')
      .notNull()
      .references(() => calendarEvents.id, { onDelete: 'cascade' }),
    songId: integer('song_id')
      .notNull()
      .references(() => songs.id, { onDelete: 'cascade' }),
  },
  (t) => [
    uniqueIndex('rehearsal_songs_idx').on(t.rehearsalId, t.songId),
  ],
)

// ─── Gig songs ───────────────────────────────────────────────────────────────

export const gigSongs = pgTable(
  'gig_songs',
  {
    id: serial('id').primaryKey(),
    bandId: integer('band_id')
      .notNull()
      .references(() => bands.id, { onDelete: 'cascade' }),
    gigId: integer('gig_id')
      .notNull()
      .references(() => calendarEvents.id, { onDelete: 'cascade' }),
    songId: integer('song_id')
      .notNull()
      .references(() => songs.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(0),
  },
  (t) => [
    index('gig_songs_gig_idx').on(t.gigId, t.position),
  ],
)

// ─── Relations ───────────────────────────────────────────────────────────────

export const bandsRelations = relations(bands, ({ many }) => ({
  members: many(bandMembers),
  songs: many(songs),
  calendarEvents: many(calendarEvents),
}))

export const usersRelations = relations(users, ({ many }) => ({
  bandMemberships: many(bandMembers),
  votes: many(votes),
  personalNotes: many(personalNotes),
}))

export const songsRelations = relations(songs, ({ one, many }) => ({
  band: one(bands, { fields: [songs.bandId], references: [bands.id] }),
  votes: many(votes),
  personalNotes: many(personalNotes),
  gigSongs: many(gigSongs),
  rehearsalSongs: many(rehearsalSongs),
}))
