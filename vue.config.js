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
        '@compiled': path.resolve(__dirname, './_compiled'),
      }
    }
  },
  publicPath: process.env.PUBLIC_PATH
}
