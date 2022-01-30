const uglify = require('uglify-js');
const fs = require('fs');
const glob = require('glob');

const sharedPath = './shared';
const outputPath = './compiled/';
const victorPath = require.resolve('victor');

//gather file contents
let victorFile = fs.readFileSync(victorPath, {encoding:'utf8', flag:'r'});
victorFile = uglify.minify(victorFile).code;

const sharedPaths = glob.sync(sharedPath + '/**/*.js');
let sharedContents = '';

sharedPaths.forEach(path => {
    const fileContents = fs.readFileSync(path, {encoding:'utf8', flag:'r'});
    sharedContents += fileContents;
});

const sharedMinified = uglify.minify(sharedContents, {output: {quote_style: 2}}).code;
const formatted = 'export const sharedLibraryFile = \'' + sharedMinified + '\';';

if (!fs.existsSync(outputPath)){
    fs.mkdirSync(outputPath);
}

fs.writeFileSync(outputPath + 'sharedLibrary.js', formatted);