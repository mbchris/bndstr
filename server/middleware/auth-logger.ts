import { defineEventHandler, getRequestURL, getHeaders, getQuery, type H3Event } from 'h3';

export default defineEventHandler((event: H3Event) => {
  const url = getRequestURL(event);
  
  // Only log authentication-related requests
  if (url.pathname.includes('/api/auth')) {
    const headers = getHeaders(event);
    const method = event.method;
    
    console.log(`\n--- [AUTH-LOGGER] ${method} ${url.toString()} ---`);
    console.log(`Pathname: ${url.pathname}`);
    console.log(`Query: ${JSON.stringify(getQuery(event))}`);
    console.log('Relevant Headers:', {
      host: headers.host,
      'x-forwarded-host': headers['x-forwarded-host'],
      'x-forwarded-proto': headers['x-forwarded-proto'],
      'x-forwarded-uri': headers['x-forwarded-uri'],
      'x-forwarded-for': headers['x-forwarded-for'],
      'x-original-uri': headers['x-original-uri'],
      origin: headers.origin,
      referer: headers.referer,
    });
    console.log('--------------------------------------------\n');
  }
});
