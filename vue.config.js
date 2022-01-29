const path = require('path');

module.exports = {
  pluginOptions: {
    i18n: {
      locale: 'en',
      fallbackLocale: 'en',
      localeDir: 'locales',
      enableInSFC: false
    }
  },
  configureWebpack: {
    resolve: {
      alias: {
        '@shared': path.resolve(__dirname, 'src/engine/shared'),
      }
    }
  },
  publicPath: process.env.PUBLIC_PATH
}
