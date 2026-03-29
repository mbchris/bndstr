# Login errors

This application has login error, but only using the mobile APK based version.
The application starts up on client side (Google Pixel 7a) without problems.
The OIDC login flow does not work. Whenever "Continue with google" or "Continue with github" is selected, the OAuth provider is called in the browser, UID/PWD are accepted, the redirect into the application works. But it is still stuck on the login page.

Find detailled logs below.

Do you need additional output to fix the issue?

The mobile device is connected and reachable using adb (ANDROID_DEVICE_ID=3B081JEHN00876).
The APK is buildable using './do build-apk production', this will also deploy it to the device.

## Applied fix

### Fix one:

● The fix is in place. Here's the summary:

  Problem: On mobile (Capacitor APK), the OAuth flow completes successfully — the server issues a bearer token and
  deep-links back to the app with ?token=...&mobileAuth=ok. But the token is never consumed because:

  1. The user is already on LoginPage when they click "Continue with Google/GitHub"
  2. The deep link handler (deeplink.ts) calls router.replace() to add the token to the query params
  3. Vue Router treats this as a same-path navigation — it updates route.query reactively but does not remount the
  component
  4. onMounted doesn't fire again, so the token-handling code never runs
  5. The routeTokenRaw const was computed at setup time (before the deep link) and is empty

  Fix: Added a watch on route.query.token that handles the token when it appears dynamically via deep link. The
  existing onMounted still covers the cold-start case (app launched directly from a deep link).

  To test, rebuild and deploy the APK with ./do build-apk production.

claude --resume cba2b3d0-d0f1-4a99-a1dd-37d5fe175384

## docker container logs
```
chris@v2202603194937439402:~$ docker logs prod-l13ho470qjum5eewggcv0lz5-233037825375 -f
<-- GET /api/auth/get-session
--> GET /api/auth/get-session 200 3ms
10.0.1.6 - - [29/Mar/2026:05:51:40 +0000] "GET /api/auth/get-session HTTP/1.1" 200 4 "https://localhost/" "Mozilla/5.0 (Linux; Android 16; Pixel 7a Build/CP1A.260305.018; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.119 Mobile Safari/537.36" "93.206.43.60"
<-- GET /api/auth/get-session
--> GET /api/auth/get-session 200 8ms
10.0.1.6 - - [29/Mar/2026:05:51:40 +0000] "GET /api/auth/get-session HTTP/1.1" 200 4 "https://localhost/" "Mozilla/5.0 (Linux; Android 16; Pixel 7a Build/CP1A.260305.018; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.119 Mobile Safari/537.36" "93.206.43.60"
<-- GET /api/auth/get-session
--> GET /api/auth/get-session 200 3ms
10.0.1.6 - - [29/Mar/2026:05:51:40 +0000] "GET /api/auth/get-session HTTP/1.1" 200 4 "https://localhost/" "Mozilla/5.0 (Linux; Android 16; Pixel 7a Build/CP1A.260305.018; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.119 Mobile Safari/537.36" "93.206.43.60"
<-- GET /api/auth/get-session
--> GET /api/auth/get-session 200 3ms
10.0.1.6 - - [29/Mar/2026:05:51:41 +0000] "GET /api/auth/get-session HTTP/1.1" 200 4 "https://localhost/" "Mozilla/5.0 (Linux; Android 16; Pixel 7a Build/CP1A.260305.018; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.119 Mobile Safari/537.36" "93.206.43.60"
<-- GET /api/auth/get-session
--> GET /api/auth/get-session 200 3ms
10.0.1.6 - - [29/Mar/2026:05:51:41 +0000] "GET /api/auth/get-session HTTP/1.1" 200 4 "https://localhost/" "Mozilla/5.0 (Linux; Android 16; Pixel 7a Build/CP1A.260305.018; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.119 Mobile Safari/537.36" "93.206.43.60"
<-- GET /api/auth/get-session
--> GET /api/auth/get-session 200 2ms
10.0.1.6 - - [29/Mar/2026:05:51:42 +0000] "GET /api/auth/get-session HTTP/1.1" 200 4 "https://localhost/" "Mozilla/5.0 (Linux; Android 16; Pixel 7a Build/CP1A.260305.018; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.119 Mobile Safari/537.36" "93.206.43.60"
<-- GET /api/auth/get-session
--> GET /api/auth/get-session 200 3ms
10.0.1.6 - - [29/Mar/2026:05:51:42 +0000] "GET /api/auth/get-session HTTP/1.1" 200 4 "https://localhost/" "Mozilla/5.0 (Linux; Android 16; Pixel 7a Build/CP1A.260305.018; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.119 Mobile Safari/537.36" "93.206.43.60"
<-- GET /api/auth/get-session
--> GET /api/auth/get-session 200 3ms
10.0.1.6 - - [29/Mar/2026:05:51:42 +0000] "GET /api/auth/get-session HTTP/1.1" 200 4 "https://localhost/" "Mozilla/5.0 (Linux; Android 16; Pixel 7a Build/CP1A.260305.018; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.119 Mobile Safari/537.36" "93.206.43.60"
<-- GET /api/mobile-auth/start?provider=google&callbackURL=https%3A%2F%2Fbndstr.trmusic.de%2Fapi%2Fmobile-auth%2Fcomplete%3FappCallbackURL%3Dorg.capacitor.bndstr%253A%252F%252Flocalhost%252F%2523%252Flogin%253Fredirect%253D%25252F&errorCallbackURL=org.capacitor.bndstr%3A%2F%2Flocalhost%2F%23%2Flogin%3Fredirect%3D%252F
--> GET /api/mobile-auth/start?provider=google&callbackURL=https%3A%2F%2Fbndstr.trmusic.de%2Fapi%2Fmobile-auth%2Fcomplete%3FappCallbackURL%3Dorg.capacitor.bndstr%253A%252F%252Flocalhost%252F%2523%252Flogin%253Fredirect%253D%25252F&errorCallbackURL=org.capacitor.bndstr%3A%2F%2Flocalhost%2F%23%2Flogin%3Fredirect%3D%252F 200 0ms
10.0.1.6 - - [29/Mar/2026:05:51:49 +0000] "GET /api/mobile-auth/start?provider=google&callbackURL=https%3A%2F%2Fbndstr.trmusic.de%2Fapi%2Fmobile-auth%2Fcomplete%3FappCallbackURL%3Dorg.capacitor.bndstr%253A%252F%252Flocalhost%252F%2523%252Flogin%253Fredirect%253D%25252F&errorCallbackURL=org.capacitor.bndstr%3A%2F%2Flocalhost%2F%23%2Flogin%3Fredirect%3D%252F HTTP/1.1" 200 774 "-" "Mozilla/5.0 (Android 16; Mobile; rv:149.0) Gecko/149.0 Firefox/149.0" "93.206.43.60"
<-- POST /api/auth/sign-in/social
--> POST /api/auth/sign-in/social 200 16ms
10.0.1.6 - - [29/Mar/2026:05:51:50 +0000] "POST /api/auth/sign-in/social HTTP/1.1" 200 432 "https://bndstr.trmusic.de/api/mobile-auth/start?provider=google&callbackURL=https%3A%2F%2Fbndstr.trmusic.de%2Fapi%2Fmobile-auth%2Fcomplete%3FappCallbackURL%3Dorg.capacitor.bndstr%253A%252F%252Flocalhost%252F%2523%252Flogin%253Fredirect%253D%25252F&errorCallbackURL=org.capacitor.bndstr%3A%2F%2Flocalhost%2F%23%2Flogin%3Fredirect%3D%252F" "Mozilla/5.0 (Android 16; Mobile; rv:149.0) Gecko/149.0 Firefox/149.0" "93.206.43.60"
<-- GET /api/auth/callback/google?state=5MEcMmEk9Waf000sWettH4PDvmvrdMTV&iss=https%3A%2F%2Faccounts.google.com&code=4%2F0Aci98E_By1qvd1cXWdGRQ2Bf2i9wnHmzZqGe_ihyjpARKapha8v8_SYo4dy4eSPCtpOo8w&scope=email+profile+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile+openid+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email&authuser=0&prompt=none
--> GET /api/auth/callback/google?state=5MEcMmEk9Waf000sWettH4PDvmvrdMTV&iss=https%3A%2F%2Faccounts.google.com&code=4%2F0Aci98E_By1qvd1cXWdGRQ2Bf2i9wnHmzZqGe_ihyjpARKapha8v8_SYo4dy4eSPCtpOo8w&scope=email+profile+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile+openid+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email&authuser=0&prompt=none 302 101ms
10.0.1.6 - - [29/Mar/2026:05:51:50 +0000] "GET /api/auth/callback/google?state=5MEcMmEk9Waf000sWettH4PDvmvrdMTV&iss=https%3A%2F%2Faccounts.google.com&code=4%2F0Aci98E_By1qvd1cXWdGRQ2Bf2i9wnHmzZqGe_ihyjpARKapha8v8_SYo4dy4eSPCtpOo8w&scope=email+profile+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile+openid+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email&authuser=0&prompt=none HTTP/1.1" 302 5 "https://bndstr.trmusic.de/" "Mozilla/5.0 (Android 16; Mobile; rv:149.0) Gecko/149.0 Firefox/149.0" "93.206.43.60"
<-- GET /api/mobile-auth/complete?appCallbackURL=org.capacitor.bndstr%3A%2F%2Flocalhost%2F%23%2Flogin%3Fredirect%3D%252F
[mobile-auth/complete] token issued, redirecting to app callback
--> GET /api/mobile-auth/complete?appCallbackURL=org.capacitor.bndstr%3A%2F%2Flocalhost%2F%23%2Flogin%3Fredirect%3D%252F 302 4ms
10.0.1.6 - - [29/Mar/2026:05:51:50 +0000] "GET /api/mobile-auth/complete?appCallbackURL=org.capacitor.bndstr%3A%2F%2Flocalhost%2F%23%2Flogin%3Fredirect%3D%252F HTTP/1.1" 302 5 "https://bndstr.trmusic.de/" "Mozilla/5.0 (Android 16; Mobile; rv:149.0) Gecko/149.0 Firefox/149.0" "93.206.43.60"
<-- GET /api/auth/get-session
--> GET /api/auth/get-session 200 2ms
10.0.1.6 - - [29/Mar/2026:05:51:50 +0000] "GET /api/auth/get-session HTTP/1.1" 200 4 "https://localhost/" "Mozilla/5.0 (Linux; Android 16; Pixel 7a Build/CP1A.260305.018; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.119 Mobile Safari/537.36" "93.206.43.60"
<-- GET /api/auth/get-session
--> GET /api/auth/get-session 200 2ms
10.0.1.6 - - [29/Mar/2026:05:51:51 +0000] "GET /api/auth/get-session HTTP/1.1" 200 4 "https://localhost/" "Mozilla/5.0 (Linux; Android 16; Pixel 7a Build/CP1A.260305.018; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.119 Mobile Safari/537.36" "93.206.43.60"
<-- GET /api/auth/get-session
--> GET /api/auth/get-session 200 2ms
10.0.1.6 - - [29/Mar/2026:05:51:51 +0000] "GET /api/auth/get-session HTTP/1.1" 200 4 "https://localhost/" "Mozilla/5.0 (Linux; Android 16; Pixel 7a Build/CP1A.260305.018; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.119 Mobile Safari/537.36" "93.206.43.60"
<-- GET /api/auth/get-session
--> GET /api/auth/get-session 200 3ms
10.0.1.6 - - [29/Mar/2026:05:51:51 +0000] "GET /api/auth/get-session HTTP/1.1" 200 4 "https://localhost/" "Mozilla/5.0 (Linux; Android 16; Pixel 7a Build/CP1A.260305.018; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.119 Mobile Safari/537.36" "93.206.43.60"
<-- GET /api/auth/get-session
--> GET /api/auth/get-session 200 2ms
10.0.1.6 - - [29/Mar/2026:05:51:52 +0000] "GET /api/auth/get-session HTTP/1.1" 200 4 "https://localhost/" "Mozilla/5.0 (Linux; Android 16; Pixel 7a Build/CP1A.260305.018; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.119 Mobile Safari/537.36" "93.206.43.60"
<-- GET /api/auth/get-session
--> GET /api/auth/get-session 200 2ms
10.0.1.6 - - [29/Mar/2026:05:51:52 +0000] "GET /api/auth/get-session HTTP/1.1" 200 4 "https://localhost/" "Mozilla/5.0 (Linux; Android 16; Pixel 7a Build/CP1A.260305.018; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.119 Mobile Safari/537.36" "93.206.43.60"
<-- GET /api/auth/get-session
--> GET /api/auth/get-session 200 3ms
10.0.1.6 - - [29/Mar/2026:05:51:52 +0000] "GET /api/auth/get-session HTTP/1.1" 200 4 "https://localhost/" "Mozilla/5.0 (Linux; Android 16; Pixel 7a Build/CP1A.260305.018; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.119 Mobile Safari/537.36" "93.206.43.60"
<-- GET /api/mobile-auth/start?provider=github&callbackURL=https%3A%2F%2Fbndstr.trmusic.de%2Fapi%2Fmobile-auth%2Fcomplete%3FappCallbackURL%3Dorg.capacitor.bndstr%253A%252F%252Flocalhost%252F%2523%252Flogin%253Fredirect%253D%25252F&errorCallbackURL=org.capacitor.bndstr%3A%2F%2Flocalhost%2F%23%2Flogin%3Fredirect%3D%252F
--> GET /api/mobile-auth/start?provider=github&callbackURL=https%3A%2F%2Fbndstr.trmusic.de%2Fapi%2Fmobile-auth%2Fcomplete%3FappCallbackURL%3Dorg.capacitor.bndstr%253A%252F%252Flocalhost%252F%2523%252Flogin%253Fredirect%253D%25252F&errorCallbackURL=org.capacitor.bndstr%3A%2F%2Flocalhost%2F%23%2Flogin%3Fredirect%3D%252F 200 1ms
10.0.1.6 - - [29/Mar/2026:05:51:55 +0000] "GET /api/mobile-auth/start?provider=github&callbackURL=https%3A%2F%2Fbndstr.trmusic.de%2Fapi%2Fmobile-auth%2Fcomplete%3FappCallbackURL%3Dorg.capacitor.bndstr%253A%252F%252Flocalhost%252F%2523%252Flogin%253Fredirect%253D%25252F&errorCallbackURL=org.capacitor.bndstr%3A%2F%2Flocalhost%2F%23%2Flogin%3Fredirect%3D%252F HTTP/1.1" 200 776 "-" "Mozilla/5.0 (Android 16; Mobile; rv:149.0) Gecko/149.0 Firefox/149.0" "93.206.43.60"
<-- POST /api/auth/sign-in/social
--> POST /api/auth/sign-in/social 200 7ms
10.0.1.6 - - [29/Mar/2026:05:51:55 +0000] "POST /api/auth/sign-in/social HTTP/1.1" 200 351 "https://bndstr.trmusic.de/api/mobile-auth/start?provider=github&callbackURL=https%3A%2F%2Fbndstr.trmusic.de%2Fapi%2Fmobile-auth%2Fcomplete%3FappCallbackURL%3Dorg.capacitor.bndstr%253A%252F%252Flocalhost%252F%2523%252Flogin%253Fredirect%253D%25252F&errorCallbackURL=org.capacitor.bndstr%3A%2F%2Flocalhost%2F%23%2Flogin%3Fredirect%3D%252F" "Mozilla/5.0 (Android 16; Mobile; rv:149.0) Gecko/149.0 Firefox/149.0" "93.206.43.60"
<-- GET /api/auth/callback/github?code=95f669597e7af9b4844e&state=d3_2v1aKPSyIykahB7UFXDhrIJcIpl4f
--> GET /api/auth/callback/github?code=95f669597e7af9b4844e&state=d3_2v1aKPSyIykahB7UFXDhrIJcIpl4f 302 685ms
10.0.1.6 - - [29/Mar/2026:05:51:56 +0000] "GET /api/auth/callback/github?code=95f669597e7af9b4844e&state=d3_2v1aKPSyIykahB7UFXDhrIJcIpl4f HTTP/1.1" 302 5 "https://bndstr.trmusic.de/" "Mozilla/5.0 (Android 16; Mobile; rv:149.0) Gecko/149.0 Firefox/149.0" "93.206.43.60"
<-- GET /api/mobile-auth/complete?appCallbackURL=org.capacitor.bndstr%3A%2F%2Flocalhost%2F%23%2Flogin%3Fredirect%3D%252F
[mobile-auth/complete] token issued, redirecting to app callback
--> GET /api/mobile-auth/complete?appCallbackURL=org.capacitor.bndstr%3A%2F%2Flocalhost%2F%23%2Flogin%3Fredirect%3D%252F 302 2ms
10.0.1.6 - - [29/Mar/2026:05:51:57 +0000] "GET /api/mobile-auth/complete?appCallbackURL=org.capacitor.bndstr%3A%2F%2Flocalhost%2F%23%2Flogin%3Fredirect%3D%252F HTTP/1.1" 302 5 "https://bndstr.trmusic.de/" "Mozilla/5.0 (Android 16; Mobile; rv:149.0) Gecko/149.0 Firefox/149.0" "93.206.43.60"
<-- GET /api/auth/get-session
--> GET /api/auth/get-session 200 2ms
10.0.1.6 - - [29/Mar/2026:05:51:57 +0000] "GET /api/auth/get-session HTTP/1.1" 200 4 "https://localhost/" "Mozilla/5.0 (Linux; Android 16; Pixel 7a Build/CP1A.260305.018; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.119 Mobile Safari/537.36" "93.206.43.60"
<-- GET /api/auth/get-session
--> GET /api/auth/get-session 200 2ms
10.0.1.6 - - [29/Mar/2026:05:51:57 +0000] "GET /api/auth/get-session HTTP/1.1" 200 4 "https://localhost/" "Mozilla/5.0 (Linux; Android 16; Pixel 7a Build/CP1A.260305.018; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.119 Mobile Safari/537.36" "93.206.43.60"
<-- GET /api/auth/get-session
--> GET /api/auth/get-session 200 2ms
10.0.1.6 - - [29/Mar/2026:05:51:57 +0000] "GET /api/auth/get-session HTTP/1.1" 200 4 "https://localhost/" "Mozilla/5.0 (Linux; Android 16; Pixel 7a Build/CP1A.260305.018; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.119 Mobile Safari/537.36" "93.206.43.60"
<-- GET /api/auth/get-session
--> GET /api/auth/get-session 200 3ms
10.0.1.6 - - [29/Mar/2026:05:51:58 +0000] "GET /api/auth/get-session HTTP/1.1" 200 4 "https://localhost/" "Mozilla/5.0 (Linux; Android 16; Pixel 7a Build/CP1A.260305.018; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.119 Mobile Safari/537.36" "93.206.43.60"
<-- GET /api/auth/get-session
--> GET /api/auth/get-session 200 3ms
10.0.1.6 - - [29/Mar/2026:05:51:58 +0000] "GET /api/auth/get-session HTTP/1.1" 200 4 "https://localhost/" "Mozilla/5.0 (Linux; Android 16; Pixel 7a Build/CP1A.260305.018; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.119 Mobile Safari/537.36" "93.206.43.60"
<-- GET /api/auth/get-session
--> GET /api/auth/get-session 200 2ms
10.0.1.6 - - [29/Mar/2026:05:51:58 +0000] "GET /api/auth/get-session HTTP/1.1" 200 4 "https://localhost/" "Mozilla/5.0 (Linux; Android 16; Pixel 7a Build/CP1A.260305.018; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.119 Mobile Safari/537.36" "93.206.43.60"
<-- GET /api/auth/get-session
--> GET /api/auth/get-session 200 2ms
10.0.1.6 - - [29/Mar/2026:05:51:59 +0000] "GET /api/auth/get-session HTTP/1.1" 200 4 "https://localhost/" "Mozilla/5.0 (Linux; Android 16; Pixel 7a Build/CP1A.260305.018; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.119 Mobile Safari/537.36" "93.206.43.60"
```

## application debug info client-side

The debug mode in the application on android device side collects this information:

```
Debug Info
DEBUG_MODE=true
Native platform=true
Platform=android
Window origin=https://localhost
Window href=https://localhost/#/login?redirect=/
Route redirect=/
Route token=(absent)
Route mobileAuth=(unset)
Route error=(unset)
Redirect path=/
API_URL(raw)=https://bndstr.trmusic.de
API base=https://bndstr.trmusic.de
Auth URL=https://bndstr.trmusic.de/api/auth
MOBILE_CALLBACK_URL(raw)=org.capacitor.bndstr://localhost/login
Native app callback=org.capacitor.bndstr://localhost/#/login?redirect=%2F
Native bridge callback=https://bndstr.trmusic.de/api/mobile-auth/complete?appCallbackURL=org.capacitor.bndstr%3A%2F%2Flocalhost%2F%23%2Flogin%3Fredirect%3D%252F
Web callback=https://localhost/login
Social callback=org.capacitor.bndstr://localhost/#/login?redirect=%2F
User agent=Mozilla/5.0 (Linux; Android 16; Pixel 7a Build/CP1A.260305.018; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.119 Mobile Safari/537.36

Debug Output
[Session Probe]
window_origin=https://localhost
window_href=https://localhost/#/login?redirect=/&token=oSEsUiq8rLMOXbPtc7GOq0wSVnCCelWW&mobileAuth=ok
route_redirect_raw=/
redirect_path=/
social_callback=org.capacitor.bndstr://localhost/#/login?redirect=%2F
authClient.getSession.error=(none)
authClient.getSession.has_user=no
authClient.getSession.has_session=no
raw_get_session.url=https://bndstr.trmusic.de/api/auth/get-session
raw_get_session.status=200
raw_get_session.acao=(none)
raw_get_session.acac=(none)
raw_get_session.aceh=(none)
raw_get_session.set_auth_token=absent
raw_get_session.body=null
raw_get_session.url=/api/auth/get-session
raw_get_session.status=200
raw_get_session.acao=(none)
raw_get_session.acac=(none)
raw_get_session.aceh=(none)
raw_get_session.set_auth_token=absent
raw_get_session.body=<!DOCTYPE html><html><head><title></title><meta charset=utf-8><meta name=description content=""><meta name=format-detection content="telephone=no"><meta name=msapplication-tap-highlight content=no><meta name=viewport con...
duration_ms=103
```
## environment information

Application is hosted on a Linux VPS with docker.
Deployments Managed by Coolify.

```
chris@v2202603194937439402:~$ docker ps -a
CONTAINER ID   IMAGE                                                                    COMMAND                  CREATED        STATUS                  PORTS                                                                                                                                                                NAMES
4f4fba0fae16   l13ho470qjum5eewggcv0lz5_prod:64f7c069931ffe807b40926f5046304d2602fe0c   "/docker-entrypoint.…"   6 hours ago    Up 6 hours              80/tcp                                                                                                                                                               prod-l13ho470qjum5eewggcv0lz5-233037825375
5007508d0dfd   dpage/pgadmin4:latest                                                    "/entrypoint.sh"         19 hours ago   Up 19 hours (healthy)   80/tcp, 443/tcp                                                                                                                                                      pgadmin-hj87sc6i7me8wch0f13ul9ym
adf48fb091fb   postgres:16-alpine                                                       "docker-entrypoint.s…"   2 days ago     Up 2 days (healthy)     5432/tcp                                                                                                                                                             aqb6a5quydiwswpgd9jpucig
5adaa083baec   myoung34/github-runner:latest                                            "/entrypoint.sh ./bi…"   3 days ago     Up 3 days (healthy)                                                                                                                                                                          runner-cccsswss4w8os4kk0w0ww8s8
426fc5d6818c   ghcr.io/coollabsio/sentinel:0.0.21                                       "/app/sentinel"          4 days ago     Up 4 days (healthy)                                                                                                                                                                          coolify-sentinel
75c5b331e64e   m48kgkkcg8c848gc440g4soc_prod:13ab28a3d7665fb965d48a16e21af6ae1a62cd93   "docker-entrypoint.s…"   6 days ago     Up 6 days               3000/tcp                                                                                                                                                             prod-m48kgkkcg8c848gc440g4soc-210843325196
5c2c75222937   traefik:v3.6                                                             "/entrypoint.sh --pi…"   7 days ago     Up 7 days (healthy)     0.0.0.0:80->80/tcp, [::]:80->80/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp, 0.0.0.0:8080->8080/tcp, [::]:8080->8080/tcp, 0.0.0.0:443->443/udp, [::]:443->443/udp   coolify-proxy
01855e26023f   ghcr.io/coollabsio/coolify:4.0.0-beta.468                                "docker-php-serversi…"   7 days ago     Up 7 days (healthy)     8000/tcp, 8080/tcp, 8443/tcp, 9000/tcp                                                                                                                               coolify
f32bab781452   ghcr.io/coollabsio/coolify-realtime:1.0.11                               "/bin/sh /soketi-ent…"   7 days ago     Up 7 days (healthy)     0.0.0.0:6001-6002->6001-6002/tcp, [::]:6001-6002->6001-6002/tcp                                                                                                      coolify-realtime
4bb6a34b0a80   redis:7-alpine                                                           "docker-entrypoint.s…"   7 days ago     Up 7 days (healthy)     6379/tcp                                                                                                                                                             coolify-redis
5276c34c8c19   postgres:15-alpine                                                       "docker-entrypoint.s…"   7 days ago     Up 7 days (healthy)     5432/tcp                                                                                                                                                             coolify-db
```

## docker inspect

```
chris@v2202603194937439402:~$ docker inspect prod-l13ho470qjum5eewggcv0lz5-233037825375
[
    {
        "Id": "4f4fba0fae160044202e667fe4a2a943a420f7309e56ea2c62518f0490c75a40",
        "Created": "2026-03-28T23:30:55.066859647Z",
        "Path": "/docker-entrypoint.sh",
        "Args": [
            "/bin/sh",
            "-c",
            "sh -c \"node /app/packages/api/dist/db/migrate.js && node /app/packages/api/dist/index.js & nginx -g 'daemon off;'\""
        ],
        "State": {
            "Status": "running",
            "Running": true,
            "Paused": false,
            "Restarting": false,
            "OOMKilled": false,
            "Dead": false,
            "Pid": 764789,
            "ExitCode": 0,
            "Error": "",
            "StartedAt": "2026-03-28T23:30:55.11046027Z",
            "FinishedAt": "0001-01-01T00:00:00Z"
        },
        "Image": "sha256:09dc73ca826f1598ca322c22b90c2356f8ee6cc0da5a72da1d056e20a6432c76",
        "ResolvConfPath": "/var/lib/docker/containers/4f4fba0fae160044202e667fe4a2a943a420f7309e56ea2c62518f0490c75a40/resolv.conf",
        "HostnamePath": "/var/lib/docker/containers/4f4fba0fae160044202e667fe4a2a943a420f7309e56ea2c62518f0490c75a40/hostname",
        "HostsPath": "/var/lib/docker/containers/4f4fba0fae160044202e667fe4a2a943a420f7309e56ea2c62518f0490c75a40/hosts",
        "LogPath": "/var/lib/docker/containers/4f4fba0fae160044202e667fe4a2a943a420f7309e56ea2c62518f0490c75a40/4f4fba0fae160044202e667fe4a2a943a420f7309e56ea2c62518f0490c75a40-json.log",
        "Name": "/prod-l13ho470qjum5eewggcv0lz5-233037825375",
        "RestartCount": 0,
        "Driver": "overlay2",
        "Platform": "linux",
        "MountLabel": "",
        "ProcessLabel": "",
        "AppArmorProfile": "docker-default",
        "ExecIDs": null,
        "HostConfig": {
            "Binds": null,
            "ContainerIDFile": "",
            "LogConfig": {
                "Type": "json-file",
                "Config": {
                    "max-file": "3",
                    "max-size": "10m"
                }
            },
            "NetworkMode": "bndstr-net",
            "PortBindings": {},
            "RestartPolicy": {
                "Name": "unless-stopped",
                "MaximumRetryCount": 0
            },
            "AutoRemove": false,
            "VolumeDriver": "",
            "VolumesFrom": null,
            "ConsoleSize": [
                0,
                0
            ],
            "CapAdd": null,
            "CapDrop": null,
            "CgroupnsMode": "private",
            "Dns": null,
            "DnsOptions": null,
            "DnsSearch": null,
            "ExtraHosts": [
                "host.docker.internal:host-gateway"
            ],
            "GroupAdd": null,
            "IpcMode": "private",
            "Cgroup": "",
            "Links": null,
            "OomScoreAdj": 0,
            "PidMode": "",
            "Privileged": false,
            "PublishAllPorts": false,
            "ReadonlyRootfs": false,
            "SecurityOpt": null,
            "UTSMode": "",
            "UsernsMode": "",
            "ShmSize": 67108864,
            "Runtime": "runc",
            "Isolation": "",
            "CpuShares": 0,
            "Memory": 0,
            "NanoCpus": 0,
            "CgroupParent": "",
            "BlkioWeight": 0,
            "BlkioWeightDevice": null,
            "BlkioDeviceReadBps": null,
            "BlkioDeviceWriteBps": null,
            "BlkioDeviceReadIOps": null,
            "BlkioDeviceWriteIOps": null,
            "CpuPeriod": 0,
            "CpuQuota": 0,
            "CpuRealtimePeriod": 0,
            "CpuRealtimeRuntime": 0,
            "CpusetCpus": "",
            "CpusetMems": "",
            "Devices": null,
            "DeviceCgroupRules": null,
            "DeviceRequests": null,
            "MemoryReservation": 0,
            "MemorySwap": 0,
            "MemorySwappiness": null,
            "OomKillDisable": null,
            "PidsLimit": null,
            "Ulimits": null,
            "CpuCount": 0,
            "CpuPercent": 0,
            "IOMaximumIOps": 0,
            "IOMaximumBandwidth": 0,
            "MaskedPaths": [
                "/proc/acpi",
                "/proc/asound",
                "/proc/interrupts",
                "/proc/kcore",
                "/proc/keys",
                "/proc/latency_stats",
                "/proc/sched_debug",
                "/proc/scsi",
                "/proc/timer_list",
                "/proc/timer_stats",
                "/sys/devices/virtual/powercap",
                "/sys/firmware"
            ],
            "ReadonlyPaths": [
                "/proc/bus",
                "/proc/fs",
                "/proc/irq",
                "/proc/sys",
                "/proc/sysrq-trigger"
            ]
        },
        "GraphDriver": {
            "Data": {
                "ID": "4f4fba0fae160044202e667fe4a2a943a420f7309e56ea2c62518f0490c75a40",
                "LowerDir": "/var/lib/docker/overlay2/2e0d9be1c0f2330d60704a3037117c288db1a46cd39026b1db193e1ee3cab73a-init/diff:/var/lib/docker/overlay2/ax31xgjukie4ghvng84tudx19/diff:/var/lib/docker/overlay2/xd5a9xwjtn5x7w041hk2rghl8/diff:/var/lib/docker/overlay2/yj39hip6ufwrnhew8sh5plqs4/diff:/var/lib/docker/overlay2/d9zkl11898b9shl3ljog6zzzo/diff:/var/lib/docker/overlay2/l8xkmcjosbtfirl1bz829q4z3/diff:/var/lib/docker/overlay2/jxz50mkg63rmtz3sxi8t5d509/diff:/var/lib/docker/overlay2/34knfeay7cyo9r830ije3b9xp/diff:/var/lib/docker/overlay2/tt7d3h402ojkyl0p62cgdgu0u/diff:/var/lib/docker/overlay2/8w16jce2t5se99fg1xaldwfg1/diff:/var/lib/docker/overlay2/o1fg713m95z9py5ydkj5bsst3/diff:/var/lib/docker/overlay2/uoi6zdavrthkp4hmhcvdliike/diff:/var/lib/docker/overlay2/f401992ba2873a4bf332fceb214eeec1111f33774d93a0055d804eea52f24f44/diff:/var/lib/docker/overlay2/06d41509f9daee8cc37b3232974e4141ba1ab9d8694eea5214d55b6916a94ad8/diff:/var/lib/docker/overlay2/e30de1e7295b5e2fadac515b3a18919cdd4c27b0dfd57158b42664eee8805ded/diff:/var/lib/docker/overlay2/326f554ef0d98ad67d13e60b4dd2d5d56f9cd1193f5662b80fd8c7f3189fbd67/diff:/var/lib/docker/overlay2/50e83127edb72c7b206dc5f497a221d63dcb7e97bffb9ac4e8a957ce93024ab3/diff:/var/lib/docker/overlay2/241c37db5b3abcb0c570d3ec55e17daa02200059764f5fec8067d19deb47261d/diff:/var/lib/docker/overlay2/a5df65e882d7d462f66bd7bc1d2419ea9f27d6326a67bf9fe27d63e218482825/diff:/var/lib/docker/overlay2/07ea235823a74022e2eca3f17ca8e7fc3162d5bdcd7e161e71308eb91f8dd1c6/diff",
                "MergedDir": "/var/lib/docker/overlay2/2e0d9be1c0f2330d60704a3037117c288db1a46cd39026b1db193e1ee3cab73a/merged",
                "UpperDir": "/var/lib/docker/overlay2/2e0d9be1c0f2330d60704a3037117c288db1a46cd39026b1db193e1ee3cab73a/diff",
                "WorkDir": "/var/lib/docker/overlay2/2e0d9be1c0f2330d60704a3037117c288db1a46cd39026b1db193e1ee3cab73a/work"
            },
            "Name": "overlay2"
        },
        "Mounts": [],
        "Config": {
            "Hostname": "4f4fba0fae16",
            "Domainname": "",
            "User": "",
            "AttachStdin": false,
            "AttachStdout": true,
            "AttachStderr": true,
            "ExposedPorts": {
                "80/tcp": {}
            },
            "Tty": false,
            "OpenStdin": false,
            "StdinOnce": false,
            "Env": [
                "SERVICE_NAME_DEV=dev",
                "DATABASE_URL=postgres://bndstr:redacted@aqb6a5quydiwswpgd9jpucig:5432/bndstr",
                "SERVICE_FQDN_PROD=bndstr.trmusic.de",
                "GITHUB_CLIENT_SECRET=redacted,
                "NODE_ENV=production",
                "COOLIFY_CONTAINER_NAME=bndstr-prod",
                "COOLIFY_BRANCH=\"main\"",
                "GOOGLE_CLIENT_ID=1082789785509-n300gmtqji9e63n03m25kdeapfb7k5f2.apps.googleusercontent.com",
                "SERVICE_NAME_PROD=prod",
                "COOLIFY_RESOURCE_UUID=l13ho470qjum5eewggcv0lz5",
                "AUTH_ORIGIN=https://bndstr.trmusic.de",
                "SERVICE_FQDN_DEV=localhost",
                "GH_TOKEN=github_pat_redacted",
                "GOOGLE_CLIENT_SECRET=redacted",
                "APP_DOMAIN=bndstr.trmusic.de",
                "COOLIFY_FQDN=bndstr.trmusic.de",
                "API_URL=https://bndstr.trmusic.de/api",
                "bndstr_GIT_REV=UNKNOWN",
                "HOST=0.0.0.0",
                "CORS_ORIGINS=https://localhost:9000,https://bndstr.trmusic.de,https://localhost",
                "PORT=3001",
                "GITHUB_CLIENT_ID=Ov23li4YzHHWZMwww1Bl",
                "WHITELIST_EMAILS=schneider.chris@gmx.de,andre@example.org",
                "SOURCE_COMMIT=UNKNOWN",
                "AUTH_TRUST_HOST=true",
                "DEVMODE=false",
                "COOLIFY_URL=https://bndstr.trmusic.de",
                "SERVICE_URL_PROD=https://bndstr.trmusic.de",
                "GH_PROJECT_OWNER=mbchris",
                "SERVICE_URL_DEV=https://localhost",
                "AUTH_SECRET=redacted",
                "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
                "NGINX_VERSION=1.27.5",
                "PKG_RELEASE=1",
                "DYNPKG_RELEASE=1",
                "NJS_VERSION=0.8.10",
                "NJS_RELEASE=1",
                "ENV=/etc/bndstr_shell_rc"
            ],
            "Cmd": [
                "/bin/sh",
                "-c",
                "sh -c \"node /app/packages/api/dist/db/migrate.js && node /app/packages/api/dist/index.js & nginx -g 'daemon off;'\""
            ],
            "Image": "l13ho470qjum5eewggcv0lz5_prod:64f7c069931ffe807b40926f5046304d2602fe0c",
            "Volumes": null,
            "WorkingDir": "/app",
            "Entrypoint": [
                "/docker-entrypoint.sh"
            ],
            "Labels": {
                "caddy_0": "https://bndstr.trmusic.de",
                "caddy_0.encode": "zstd gzip",
                "caddy_0.handle_path": "/*",
                "caddy_0.handle_path.0_reverse_proxy": "{{upstreams}}",
                "caddy_0.header": "-Server",
                "caddy_0.try_files": "{path} /index.html /index.php",
                "caddy_ingress_network": "l13ho470qjum5eewggcv0lz5",
                "com.docker.compose.config-hash": "4c1c2c4b80a2db1f0b11ec92df7872dbfe5a0c3ee018f715218034cd1adf2733",
                "com.docker.compose.container-number": "1",
                "com.docker.compose.depends_on": "",
                "com.docker.compose.image": "sha256:09dc73ca826f1598ca322c22b90c2356f8ee6cc0da5a72da1d056e20a6432c76",
                "com.docker.compose.oneoff": "False",
                "com.docker.compose.project": "lytl9buylh11ll20vr3msb82",
                "com.docker.compose.project.config_files": "/artifacts/lytl9buylh11ll20vr3msb82/docker-compose.yml",
                "com.docker.compose.project.environment_file": "/artifacts/lytl9buylh11ll20vr3msb82/.env",
                "com.docker.compose.project.working_dir": "/artifacts/lytl9buylh11ll20vr3msb82",
                "com.docker.compose.service": "prod",
                "com.docker.compose.version": "2.38.2",
                "coolify.applicationId": "4",
                "coolify.environmentName": "production",
                "coolify.managed": "true",
                "coolify.name": "prod-l13ho470qjum5eewggcv0lz5-233037825375",
                "coolify.projectName": "bndstr",
                "coolify.pullRequestId": "0",
                "coolify.resourceName": "bndstr",
                "coolify.serviceName": "bndstr",
                "coolify.type": "application",
                "coolify.version": "4.0.0-beta.468",
                "maintainer": "NGINX Docker Maintainers <docker-maint@nginx.com>",
                "traefik.docker.network": "coolify",
                "traefik.enable": "true",
                "traefik.http.middlewares.gzip.compress": "true",
                "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme": "https",
                "traefik.http.routers.bndstr-prod.entrypoints": "https",
                "traefik.http.routers.bndstr-prod.rule": "Host(`${APP_DOMAIN:-bndstr.trmusic.de}`)",
                "traefik.http.routers.bndstr-prod.tls": "true",
                "traefik.http.routers.bndstr-prod.tls.certresolver": "letsencrypt",
                "traefik.http.routers.http-0-l13ho470qjum5eewggcv0lz5-prod.entryPoints": "http",
                "traefik.http.routers.http-0-l13ho470qjum5eewggcv0lz5-prod.middlewares": "redirect-to-https",
                "traefik.http.routers.http-0-l13ho470qjum5eewggcv0lz5-prod.rule": "Host(`bndstr.trmusic.de`) && PathPrefix(`/`)",
                "traefik.http.routers.https-0-l13ho470qjum5eewggcv0lz5-prod.entryPoints": "https",
                "traefik.http.routers.https-0-l13ho470qjum5eewggcv0lz5-prod.middlewares": "gzip",
                "traefik.http.routers.https-0-l13ho470qjum5eewggcv0lz5-prod.rule": "Host(`bndstr.trmusic.de`) && PathPrefix(`/`)",
                "traefik.http.routers.https-0-l13ho470qjum5eewggcv0lz5-prod.tls": "true",
                "traefik.http.routers.https-0-l13ho470qjum5eewggcv0lz5-prod.tls.certresolver": "letsencrypt",
                "traefik.http.services.bndstr-prod.loadbalancer.server.port": "80"
            },
            "StopSignal": "SIGQUIT"
        },
        "NetworkSettings": {
            "SandboxID": "67042fcfae10edd82c5020a01ae47493365f9d328e0d8cd5a0c4d31c99fb85de",
            "SandboxKey": "/var/run/docker/netns/67042fcfae10",
            "Ports": {
                "80/tcp": null
            },
            "Networks": {
                "bndstr-net": {
                    "IPAMConfig": null,
                    "Links": null,
                    "Aliases": [
                        "prod-l13ho470qjum5eewggcv0lz5-233037825375",
                        "prod"
                    ],
                    "DriverOpts": null,
                    "GwPriority": 0,
                    "NetworkID": "7a05bce0c9c00b65654fe1059dc15582dfb9a74e04d6d8e9e59d1eb3a853250c",
                    "EndpointID": "8001f5735a378426a87507eebf5fdab9c209a202e5c592ee88c986e7c48c0dd1",
                    "Gateway": "10.0.7.1",
                    "IPAddress": "10.0.7.2",
                    "MacAddress": "d6:c1:89:cd:3c:a1",
                    "IPPrefixLen": 24,
                    "IPv6Gateway": "",
                    "GlobalIPv6Address": "",
                    "GlobalIPv6PrefixLen": 0,
                    "DNSNames": [
                        "prod-l13ho470qjum5eewggcv0lz5-233037825375",
                        "prod",
                        "4f4fba0fae16"
                    ]
                },
                "coolify": {
                    "IPAMConfig": null,
                    "Links": null,
                    "Aliases": [
                        "prod-l13ho470qjum5eewggcv0lz5-233037825375",
                        "prod"
                    ],
                    "DriverOpts": null,
                    "GwPriority": 0,
                    "NetworkID": "a6e8fe6ebd39dc1739127b6efca84471e170c74e925db92c5f5ea8fdae6a557e",
                    "EndpointID": "92bbb5c45177ecbb246ec80706011e6cddab26553723ee17629bda1e5985dcca",
                    "Gateway": "10.0.1.1",
                    "IPAddress": "10.0.1.9",
                    "MacAddress": "06:57:5a:0c:b5:a8",
                    "IPPrefixLen": 24,
                    "IPv6Gateway": "fdbe:c731:a34::1",
                    "GlobalIPv6Address": "fdbe:c731:a34::9",
                    "GlobalIPv6PrefixLen": 64,
                    "DNSNames": [
                        "prod-l13ho470qjum5eewggcv0lz5-233037825375",
                        "prod",
                        "4f4fba0fae16"
                    ]
                },
                "l13ho470qjum5eewggcv0lz5": {
                    "IPAMConfig": null,
                    "Links": null,
                    "Aliases": [
                        "prod-l13ho470qjum5eewggcv0lz5-233037825375",
                        "prod"
                    ],
                    "DriverOpts": null,
                    "GwPriority": 0,
                    "NetworkID": "7ec529fb2b737afbb4f6d5dff7eb456f26f28c433cef2c26f3e0f5a5e505a17d",
                    "EndpointID": "38c8ee5168ca620ec2245234ad530b9f110050c890326c223595335b1cd49681",
                    "Gateway": "10.0.6.1",
                    "IPAddress": "10.0.6.3",
                    "MacAddress": "62:ff:56:bc:02:65",
                    "IPPrefixLen": 24,
                    "IPv6Gateway": "",
                    "GlobalIPv6Address": "",
                    "GlobalIPv6PrefixLen": 0,
                    "DNSNames": [
                        "prod-l13ho470qjum5eewggcv0lz5-233037825375",
                        "prod",
                        "4f4fba0fae16"
                    ]
                }
            }
        }
    }
]```