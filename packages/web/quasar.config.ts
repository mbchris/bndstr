import { configure } from 'quasar/wrappers'

export default configure(function (/* ctx */) {
  const apiTarget = process.env.API_TARGET || `http://localhost:${process.env.API_PORT || '3001'}`
  const rawApiUrl = (process.env.API_URL || '').trim()
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
