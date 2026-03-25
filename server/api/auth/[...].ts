import GithubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { NuxtAuthHandler } from '#auth'
import { db } from '~/server/database'
import { users } from '~/server/database/schema'
import { eq } from 'drizzle-orm'

// ── Auth URL Debugging ──
// sidebase/nuxt-auth and Auth.js use NUXT_AUTH_ORIGIN and NEXTAUTH_URL
// to determine the callback URIs. 
const origin = process.env.NUXT_AUTH_ORIGIN || process.env.AUTH_ORIGIN || 'https://bndstr.trmusic.de';
const appBase = process.env.NUXT_APP_BASE_URL || '/';

// Auth.js expects NEXTAUTH_URL to be the base of the auth API.
const fullAuthUrl = origin.replace(/\/$/, '') + '/api/auth';
process.env.NEXTAUTH_URL = fullAuthUrl;

console.log(`[AUTH] Initialization:`, {
    origin,
    appBase,
    fullAuthUrl,
    NODE_ENV: process.env.NODE_ENV,
    trustHost: process.env.AUTH_TRUST_HOST || 'not set'
});

export default NuxtAuthHandler({
    secret: useRuntimeConfig().authSecret,
    providers: [
        // @ts-expect-error You need to use .default here for it to work during SSR in some environments
        (GoogleProvider.default || GoogleProvider)({
            clientId: useRuntimeConfig().googleClientId,
            clientSecret: useRuntimeConfig().googleClientSecret
        }),
        // @ts-expect-error
        (GithubProvider.default || GithubProvider)({
            clientId: useRuntimeConfig().githubClientId,
            clientSecret: useRuntimeConfig().githubClientSecret
        })
        ,
        // Dev Credentials Provider for local testing
        // @ts-expect-error
        // (CredentialsProvider.default || CredentialsProvider)({
        //     name: 'Dev Login',
        //     credentials: {
        //         email: { label: "Email", type: "text", placeholder: "mail@example.org" }
        //     },
        //     async authorize(credentials: any) {
        //         // ONLY allow this provider in dev mode
        //         if (process.env.DEVMODE !== 'true') return null;

        //         const email = (credentials?.email || 'schneider.chris@gmx.de').toLowerCase();

        //         // Return a mock user object that matches what callbacks expect
        //         return {
        //             id: 'dev-999',
        //             name: 'Dev Admin',
        //             email: email,
        //             role: 'admin'
        //         }
        //     }
        // })
    ],
    callbacks: {
        async jwt({ token, user }) {
            // When user logs in, user object is provided
            if (user) {
                const dbUser = await db.select().from(users).where(eq(users.email, user.email || '')).get();
                if (dbUser) {
                    token.role = dbUser.role;
                    token.id = dbUser.id;
                }
            }
            // If they are already logged in but token is missing role/id, try to fix it
            else if (token.email && (!token.role || !token.id)) {
                const dbUser = await db.select().from(users).where(eq(users.email, token.email)).get();
                if (dbUser) {
                    token.role = dbUser.role;
                    token.id = dbUser.id;
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = token.role;
                (session.user as any).id = token.id;
            }
            return session;
        },
        async signIn({ user, account, profile, email, credentials }) {
            console.log('\n--- [AUTH DEBUG] SIGN IN ATTEMPT ---');
            console.log('User:', JSON.stringify(user, null, 2));
            console.log('Account:', JSON.stringify(account, null, 2));
            console.log('Profile:', JSON.stringify(profile, null, 2));
            const runtimeConfig = useRuntimeConfig();
            console.log('Config:', {
                authOrigin: runtimeConfig.public.authOrigin,
                baseAppUrl: process.env.NUXT_APP_BASE_URL,
                authSecret: runtimeConfig.authSecret ? '***' : 'MISSING',
            });
            console.log('--------------------------------------\n');

            if (process.env.DEVMODE === 'true') {
                return true;
            }
            console.log('[AUTH] Login attempt:', { email: user?.email, name: user?.name, id: user?.id, profileEmail: profile?.email, profileLogin: (profile as any)?.login });

            if (!user?.email && !profile?.email) {
                console.log('[AUTH] Rejected: No email provided by provider.');
                return false;
            }

            const effectiveEmail = (user?.email || profile?.email || '').toLowerCase();
            const hardcodedAdmin = "schneider.chris@gmx.de";
            const role = effectiveEmail === hardcodedAdmin ? 'admin' : 'user';

            let existingUser = await db.select().from(users).where(eq(users.email, effectiveEmail)).get();

            const whitelistRaw = useRuntimeConfig().authWhitelistEmails;
            if (whitelistRaw) {
                const whitelistedEmails = whitelistRaw.split(',').map(e => e.trim().toLowerCase());
                // Only reject if NOT in whitelist AND NOT an existing user in DB
                if (!whitelistedEmails.includes(effectiveEmail) && !existingUser) {
                    console.log(`[AUTH] Rejected: Email ${effectiveEmail} not in whitelist and not in database.`);
                    return false;
                }
            }

            console.log(`[AUTH] Accepted: ${effectiveEmail} (Target Role: ${role})`);

            if (!existingUser) {
                console.log(`[AUTH] User ${effectiveEmail} not in DB. Auto-creating as ${role}...`);
                const newUser = await db.insert(users).values({
                    name: user?.name || (profile as any)?.name || effectiveEmail.split('@')[0],
                    email: effectiveEmail,
                    role: role
                }).returning();
                existingUser = newUser[0];
            } else if (existingUser.role !== role && effectiveEmail === hardcodedAdmin) {
                console.log(`[AUTH] Upgrading existing hardcoded admin ${effectiveEmail} to admin role.`);
                await db.update(users).set({ role: 'admin' }).where(eq(users.id, existingUser.id)).run();
            }

            return !!existingUser;
        }
    }
})
