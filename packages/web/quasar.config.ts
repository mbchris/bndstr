import { configure } from 'quasar/wrappers'

export default configure(function (/* ctx */) {
  return {
    eslint: {
      fix: true,
    },

    boot: ['auth', 'api', 'i18n'],

    css: ['app.scss'],

    extras: ['roboto-font', 'material-icons'],

    build: {
      target: {
        browser: ['es2022', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
        node: 'node20',
      },
      vueRouterMode: 'history',
      vitePlugins: [],
      env: {
        API_URL: process.env.API_URL || 'http://localhost:3001',
      },
    },

    devServer: {
      port: 9000,
      proxy: {
        '/api': {
          target: process.env.API_URL || 'http://localhost:3001',
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
