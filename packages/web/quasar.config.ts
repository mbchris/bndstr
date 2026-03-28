import { configure } from 'quasar/wrappers'
import { execSync } from 'node:child_process'

function readGitRev(): string {
  if (process.env.GIT_REV?.trim()) {
    return process.env.GIT_REV.trim()
  }

  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return 'unknown'
  }
}

export default configure(function (/* ctx */) {
  const rawApiUrl = (process.env.API_URL || '').trim()
  const debugMode = (process.env.DEBUG_MODE || '').trim().toLowerCase() === 'true'
  const gitRev = readGitRev()
  const mobileCallbackUrl = (process.env.MOBILE_CALLBACK_URL || '').trim() || 'org.capacitor.bndstr://localhost/login'
  const apiTarget =
    process.env.API_TARGET ||
    (rawApiUrl.startsWith('http://') || rawApiUrl.startsWith('https://')
      ? rawApiUrl
      : `http://localhost:${process.env.API_PORT || process.env.PORT || '3001'}`)
  const apiUrl = rawApiUrl.replace(/\/+$/, '').replace(/\/api$/, '')

  return {
    eslint: {
      fix: true,
    },

    boot: ['pinia', 'auth', 'api', 'i18n'],

    css: ['app.scss'],

    extras: ['material-icons'],

    build: {
      target: {
        browser: ['es2022', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
        node: 'node20',
      },
      vueRouterMode: 'history',
      vitePlugins: [],
      env: {
        API_URL: apiUrl,
        DEBUG_MODE: String(debugMode),
        GIT_REV: gitRev,
        MOBILE_CALLBACK_URL: mobileCallbackUrl,
      },
    },

    devServer: {
      port: 9000,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },

    framework: {
      config: {
        dark: 'auto',
        notify: {},
      },
      plugins: ['Notify', 'Dialog', 'Loading', 'LocalStorage'],
    },

    animations: [],

    ssr: {
      pwa: false,
    },

    capacitor: {
      hideSplashscreen: true,
    },

    pwa: {
      workboxMode: 'GenerateSW',
      injectPwaMetaTags: true,
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',
    },
  }
})
