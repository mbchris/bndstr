import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { join } from 'path';
import { mkdirSync } from 'fs';

// Database file path inside the Nuxt app (mounted in Docker if needed)
const dbDir = join(process.cwd(), '.data');
try {
    mkdirSync(dbDir, { recursive: true });
} catch (e) {
    // Directory exists or permisson error
}

const sqlite = new Database(join(dbDir, 'sqlite.db'));

// Disable WAL mode internally or it can cause locking in some simple configurations
sqlite.pragma('journal_mode = WAL');

// Initialize schema
sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS calendar_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        start_time INTEGER NOT NULL,
        end_time INTEGER NOT NULL,
        type TEXT NOT NULL DEFAULT 'rehearsal',
        user_id INTEGER REFERENCES users(id),
        bierwart_override_id INTEGER REFERENCES users(id),
        is_tentative INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS personal_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        song_id INTEGER NOT NULL REFERENCES songs(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS songs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        spotify_url TEXT,
        youtube_url TEXT,
        thumbnail_url TEXT,
        notes TEXT,
        type TEXT NOT NULL DEFAULT 'song',
        pitch INTEGER NOT NULL DEFAULT 0,
        is_setlist INTEGER NOT NULL DEFAULT 0,
        position INTEGER NOT NULL DEFAULT 0,
        is_pinned INTEGER NOT NULL DEFAULT 0,
        added_by INTEGER REFERENCES users(id),
        created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        song_id INTEGER NOT NULL REFERENCES songs(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        score INTEGER NOT NULL DEFAULT 0,
        comment TEXT,
        created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rehearsal_songs (
        rehearsal_id INTEGER NOT NULL REFERENCES calendar_events(id),
        song_id INTEGER NOT NULL REFERENCES songs(id)
    );

    CREATE TABLE IF NOT EXISTS gig_songs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        gig_id INTEGER NOT NULL REFERENCES calendar_events(id),
        song_id INTEGER NOT NULL REFERENCES songs(id),
        position INTEGER NOT NULL DEFAULT 0
    );
`);

// Try applying schema updates for Iteration 4/5 safely
const migrations = [
    "ALTER TABLE songs ADD COLUMN type TEXT NOT NULL DEFAULT 'song'",
    "ALTER TABLE songs ADD COLUMN pitch INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE songs ADD COLUMN is_setlist INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE songs ADD COLUMN position INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE songs ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE votes ADD COLUMN score INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE users ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE calendar_events ADD COLUMN bierwart_override_id INTEGER REFERENCES users(id)",
    "INSERT INTO calendar_events (id, title, description, start_time, end_time, type, created_at) SELECT id, 'Rehearsal', focus, date, date + 7200000, 'rehearsal', created_at FROM rehearsals WHERE NOT EXISTS (SELECT 1 FROM calendar_events WHERE calendar_events.id = rehearsals.id)",
    "UPDATE users SET role = 'user' WHERE role = 'member'",
    "ALTER TABLE songs ADD COLUMN thumbnail_url TEXT",
    "UPDATE calendar_events SET start_time = start_time * 1000 WHERE start_time < 2000000000",
    "UPDATE calendar_events SET end_time = end_time * 1000 WHERE end_time < 2000000000",
    "UPDATE calendar_events SET created_at = created_at * 1000 WHERE created_at < 2000000000",
    "UPDATE users SET created_at = created_at * 1000 WHERE created_at < 2000000000",
    "UPDATE songs SET created_at = created_at * 1000 WHERE created_at < 2000000000",
    "UPDATE votes SET created_at = created_at * 1000 WHERE created_at < 2000000000",
    "ALTER TABLE calendar_events ADD COLUMN is_tentative INTEGER NOT NULL DEFAULT 0",
    "CREATE TABLE IF NOT EXISTS personal_notes (id INTEGER PRIMARY KEY AUTOINCREMENT, song_id INTEGER NOT NULL REFERENCES songs(id), user_id INTEGER NOT NULL REFERENCES users(id), content TEXT NOT NULL, created_at INTEGER NOT NULL)",
    "CREATE TABLE IF NOT EXISTS gig_songs (id INTEGER PRIMARY KEY AUTOINCREMENT, gig_id INTEGER NOT NULL REFERENCES calendar_events(id), song_id INTEGER NOT NULL REFERENCES songs(id), position INTEGER NOT NULL DEFAULT 0)",
    "ALTER TABLE users ADD COLUMN is_hidden INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE users ADD COLUMN beer_count INTEGER NOT NULL DEFAULT 0"
];

for (const query of migrations) {
    try {
        sqlite.exec(query);
    } catch (e) {
        // Ignored. Field likely already exists. SQLite throws if duplicate column.
    }
}

// Seed sample data if empty
const userCount = sqlite.prepare('SELECT count(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
    console.log('Seeding initial data...');
    const now = Date.now();
    
    // Sample Band Members
    const bandMembers = [
        { name: 'Chris', email: 'schneider.chris@gmx.de', role: 'admin' },
        { name: 'Andre', email: 'andrehoyer.ah@googlemail.com', role: 'user' },
        { name: 'Stefan', email: 'stefan@example.org', role: 'user' },
        { name: 'Andreas', email: 'andreas@example.org', role: 'user' },
        { name: 'Daniel', email: 'd.vollkommer@gmail.com', role: 'user' }
    ];
    for (let i = 0; i < bandMembers.length; i++) {
        const m = bandMembers[i];
        sqlite.prepare('INSERT INTO users (name, email, role, sort_order, created_at) VALUES (?, ?, ?, ?, ?)')
            .run(m.name, m.email, m.role, i, now);
    }

    // Sample Songs
    const setlistSongs = [
        ['Holiday', 'Green Day', 'https://open.spotify.com/intl-de/track/5vfjUAhefN7IjHbTvVCT4Z?si=4ab5dfb87a1d44cd'],
        ['Schrei nach Liebe', 'Die Ärzte', 'https://open.spotify.com/intl-de/track/4P4PHxZQ1FcwQKKnfEPsAZ?si=68958f13905f4bca'],
        ['Bad Guy', 'The Interrupters', 'https://open.spotify.com/intl-de/track/0iM1Ioz4N4p7MU1DKyqsov?si=1982a2ec6d844df5'],
        ['Countdown to Insanity', 'H-Blockx', 'https://open.spotify.com/intl-de/track/2XNaKS5wO5rPdgpPYVKria?si=f2c3a6dc0d144782'],
        ['Down in the past', 'Mando Diao', 'https://open.spotify.com/intl-de/track/2vx5Dc3Zxtd5yGDlh2pAAz?si=c19e003366684d9b'],
        ['Last resort', 'Papa Roach', 'https://open.spotify.com/intl-de/track/5W8YXBz9MTIDyrpYaCg2Ky?si=3ae221d3b6234a7c'],
        ['Billy Jean', 'The Bates', 'https://open.spotify.com/intl-de/track/5RpBC0VsMMSRYJmSgUZqDu?si=6644d5bee27d45bb'],
        ['Wild World', 'Me first and the gimme gimmes', 'https://open.spotify.com/intl-de/track/73PzrTVxMl8kmoSvFYLpig?si=b50ba624beaa41d3']
    ];

    const votingSongs = [
        ['Californication', 'Red Hot Chili Peppers', 'https://open.spotify.com/intl-de/track/48UPSzbZjgc449aqz8bxox?si=4ef0218567534539'],
        ['Take me out', 'Franz Ferdinand', 'https://open.spotify.com/intl-de/track/20I8RduZC2PWMWTDCZuuAN?si=2ec0e818266942d2'],
        ['Das geht ab', 'Die Atzen', 'https://open.spotify.com/intl-de/track/2P2kgRRvHflstcRHWC6v8n?si=2af35687dbf24627'],
        ['Auf gute Freunde', 'Onkelz', 'https://open.spotify.com/intl-de/track/0oIVNEkOgvOU9yG9oW13xC?si=499a70e53db54846']
    ];

    for (const [title, artist, url] of setlistSongs) {
        sqlite.prepare('INSERT OR IGNORE INTO songs (title, artist, spotify_url, type, is_setlist, created_at) VALUES (?, ?, ?, ?, ?, ?)')
            .run(title, artist, url, 'song', 1, now);
    }

    for (const [title, artist, url] of votingSongs) {
        sqlite.prepare('INSERT OR IGNORE INTO songs (title, artist, spotify_url, type, is_setlist, created_at) VALUES (?, ?, ?, ?, ?, ?)')
            .run(title, artist, url, 'song', 0, now);
    }
    
    // Sample Rehearsals (Next 10 weeks, Thursdays 20:00 - 23:00)
    // 2026-03-20 is a Friday. First Thursday is 2026-03-26.
    const firstThursday = new Date('2026-03-26T20:00:00');
    for (let i = 0; i < 10; i++) {
        const start = new Date(firstThursday);
        start.setDate(firstThursday.getDate() + (i * 7));
        const end = new Date(start);
        end.setHours(start.getHours() + 3);
        
        sqlite.prepare('INSERT OR IGNORE INTO calendar_events (title, description, start_time, end_time, type, created_at) VALUES (?, ?, ?, ?, ?, ?)')
            .run(`Bandprobe #${i + 1}`, 'Probe und Bierverkostung', start.getTime(), end.getTime(), 'rehearsal', now);
    }
    
    // Sample Gigs
    const gig1Date = new Date(now + (3 * 7 * 24 * 60 * 60 * 1000)); // 3 weeks
    gig1Date.setHours(19, 0, 0, 0);
    const gig2Date = new Date(now + (5 * 7 * 24 * 60 * 60 * 1000)); // 5 weeks
    gig2Date.setHours(21, 0, 0, 0);

    sqlite.prepare('INSERT OR IGNORE INTO calendar_events (title, description, start_time, end_time, type, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run('Gartenhallenbad', 'Live Show', gig1Date.getTime(), gig1Date.getTime() + 7200000, 'gig', now);
    
    sqlite.prepare('INSERT OR IGNORE INTO calendar_events (title, description, start_time, end_time, type, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run('Wrench Crew Party', 'Rock Night', gig2Date.getTime(), gig2Date.getTime() + 7200000, 'gig', now);
    
    console.log('Seeding complete.');
}

// Export DB instances
export const sqliteInstance = sqlite;
export const db = drizzle(sqlite, { schema });
