import { defineEventHandler, createError, sendStream, setResponseHeaders } from 'h3';
import { db, sqliteInstance } from '~/server/database';
import { users } from '~/server/database/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getServerSession } from '#auth';
import { createReadStream } from 'node:fs';
import { join } from 'node:path';

export default defineEventHandler(async (event) => {
    const session = await getServerSession(event);
    let currentUser = null;
    if (session?.user?.email) {
        currentUser = await db.select().from(users).where(eq(users.email, session.user.email)).get();
    }
    
    // Dev mode bypass
    if (!currentUser && process.env.DEVMODE === 'true') {
        currentUser = { role: 'admin' } as any;
    }

    if (!currentUser || currentUser.role !== 'admin') {
        throw createError({ statusCode: 403, message: 'Forbidden' });
    }

    const tables = ['users', 'calendar_events', 'songs', 'votes', 'rehearsal_songs'];
    let sqlDump = '-- bndstr Database Backup\n';
    sqlDump += '-- Created: ' + new Date().toISOString() + '\n\n';
    sqlDump += 'PRAGMA foreign_keys=OFF;\n\n';

    for (const tableName of tables) {
        // 1. Get CREATE statement
        const schema = db.select({ sql: sql`sql` }).from(sql`sqlite_master`).where(and(eq(sql`type`, 'table'), eq(sql`name`, tableName))).get() as any;
        if (!schema || !schema.sql) continue;

        sqlDump += `DROP TABLE IF EXISTS ${tableName};\n`;
        sqlDump += schema.sql + ';\n';

        // 2. Get Data
        const rows = sqliteInstance.prepare(`SELECT * FROM ${tableName}`).all() as any[];
        if (rows.length > 0) {
            const columns = Object.keys(rows[0]);
            for (const row of rows) {
                const values = columns.map(col => {
                    const val = row[col];
                    if (val === null) return 'NULL';
                    if (typeof val === 'string') return "'" + val.replace(/'/g, "''") + "'";
                    if (val instanceof Date) return val.getTime();
                    return val;
                });
                sqlDump += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
            }
        }
        sqlDump += '\n';
    }

    sqlDump += 'PRAGMA foreign_keys=ON;\n';

    setResponseHeaders(event, {
        'Content-Type': 'text/plain',
        'Content-Disposition': 'attachment; filename="bndstr-backup.sql"'
    });

    return sqlDump;
});
