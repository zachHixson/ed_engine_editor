const path = require('path');
const fs = require('fs');

const shared = fs.readFileSync('./_compiled/Shared.js', {encoding: 'utf-8', flag: 'r'});
const engine = fs.readFileSync('./_compiled/Engine.js', {encoding: 'utf-8', flag: 'r'});
const engineTemplate = fs.readFileSync('./engine/export_template.html', {encoding: 'utf-8', flag: 'r'});

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
    },
  },
  chainWebpack: config => {
    config
        .plugin('html')
        .tap(args => {
          args[0].shared = shared;
          args[0].engine = engine;
          args[0].engineTemplate = engineTemplate;
          return args;
        })
  },
  publicPath: process.env.PUBLIC_PATH
}
