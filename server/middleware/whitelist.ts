/**
 * Whitelist middleware disabled. 
 * Whitelist verification is already handled in the NuxtAuthHandler sign-in callback.
 * This global middleware was causing memory leaks due to repeated session calls.
 */
export default defineEventHandler(() => {
    // No-op
});

