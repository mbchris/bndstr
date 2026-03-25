import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    role: text('role').notNull().default('user'), // admin | user
    sortOrder: integer('sort_order').notNull().default(0),
    isHidden: integer('is_hidden', { mode: 'boolean' }).default(false).notNull(),
    beerCount: integer('beer_count').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const calendarEvents = sqliteTable('calendar_events', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    description: text('description'),
    startTime: integer('start_time').notNull(),
    endTime: integer('end_time').notNull(),
    type: text('type').notNull().default('rehearsal'), // 'rehearsal' | 'gig' | 'event' | 'unavailability'
    userId: integer('user_id').references(() => users.id), // For unavailabilities
    bierwartOverrideId: integer('bierwart_override_id').references(() => users.id), // For manual bierwart
    isTentative: integer('is_tentative', { mode: 'boolean' }).default(false).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const personalNotes = sqliteTable('personal_notes', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    songId: integer('song_id').notNull().references(() => songs.id),
    userId: integer('user_id').notNull().references(() => users.id),
    content: text('content').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const songs = sqliteTable('songs', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    artist: text('artist').notNull(),
    spotifyUrl: text('spotify_url'),
    youtubeUrl: text('youtube_url'),
    thumbnailUrl: text('thumbnail_url'),
    notes: text('notes'),
    type: text('type').default('song').notNull(), // 'song' | 'pause' | 'tuning'
    pitch: integer('pitch').default(0).notNull(), // -5 to +5
    isSetlist: integer('is_setlist', { mode: 'boolean' }).default(false).notNull(),
    position: integer('position').default(0).notNull(),
    isPinned: integer('is_pinned', { mode: 'boolean' }).default(false).notNull(),
    addedBy: integer('added_by').references(() => users.id),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const votes = sqliteTable('votes', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    songId: integer('song_id').notNull().references(() => songs.id),
    userId: integer('user_id').notNull().references(() => users.id),
    score: integer('score').default(0).notNull(), // 0 = veto, 1 = ok, 2 = good, 3 = great
    comment: text('comment'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const rehearsalSongs = sqliteTable('rehearsal_songs', {
    rehearsalId: integer('rehearsal_id').notNull().references(() => calendarEvents.id),
    songId: integer('song_id').notNull().references(() => songs.id),
});

export const gigSongs = sqliteTable('gig_songs', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    gigId: integer('gig_id').notNull().references(() => calendarEvents.id),
    songId: integer('song_id').notNull().references(() => songs.id),
    position: integer('position').default(0).notNull(),
});
