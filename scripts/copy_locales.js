const fs = require('fs');

const srcDir = './src/locales/';

const fileNames = fs.readdirSync(srcDir).filter(i => i.includes('.json'));

fileNames.forEach(name => {
    fs.copyFileSync(srcDir + name, './dist/' + name);
});