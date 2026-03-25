import { defineEventHandler } from 'h3';

export default defineEventHandler((event) => {
    const config = useRuntimeConfig();
    return {
        google: !!(config.googleClientId && config.googleClientSecret),
        github: !!(config.githubClientId && config.githubClientSecret),
    };
});
