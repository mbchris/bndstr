import { defineEventHandler, createError, readMultipartFormData } from 'h3';
import { db, sqliteInstance } from '~/server/database';
import { users } from '~/server/database/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from '#auth';

export default defineEventHandler(async (event) => {
    // Auth check
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

    const formData = await readMultipartFormData(event);
    if (!formData || formData.length === 0) {
        throw createError({ statusCode: 400, message: 'No file uploaded' });
    }

    const file = formData.find(f => f.name === 'file');
    if (!file) {
        throw createError({ statusCode: 400, message: 'No file found in "file" field' });
    }

    const sqlContent = file.data.toString();
    
    try {
        // Warning: This executes raw SQL. 
        // We use sqliteInstance.exec() which supports multi-statement strings.
        sqliteInstance.exec(sqlContent);
        return { success: true, message: 'Database imported successfully' };
    } catch (e: any) {
        console.error('Import error:', e);
        throw createError({
            statusCode: 500,
            message: 'SQL execution failed: ' + e.message
        });
    }
});
