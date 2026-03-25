import { defineEventHandler } from 'h3';
import { db } from '~/server/database';
import { sql } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
    try {
        const result = db.run(sql`SELECT 1`);
        return { status: "ok", result };
    } catch (e: any) {
        return { status: "error", message: e.message };
    }
});
