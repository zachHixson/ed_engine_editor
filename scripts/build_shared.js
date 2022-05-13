const uglify = require('uglify-js');
const fs = require('fs');
const {execSync} = require('child_process');
const rollupConfig = require('../shared/rollup.config.js');
const victorPath = require.resolve('victor');

execSync('npx rollup --config ./shared/rollup.config.js');

//shrink victor
let victorFile = fs.readFileSync(victorPath, {encoding: 'utf-8', flag: 'r'});
victorFile = victorFile.replace('exports', '//');
victorFile = uglify.minify(victorFile).code;

const debug = process.argv.includes('--debug');
const tempFilePath = rollupConfig[0].output.file;
const outputPath = './_compiled/';
const rolledShared = fs.readFileSync(tempFilePath, {encoding: 'utf-8'});
const minifiedShared = debug ? rolledShared : uglify.minify(rolledShared, {output: {quote_style: 2}}).code;
const combined = (victorFile + minifiedShared)
const formatted =
`let sharedLibraryFile = \`${
    combined.replace(/\\/g, "\\\\")
    .replace(/\$/g, "\\$")
    .replace(/'/g, "\\'")
    .replace(/"/g, "\\\"")
}\`;

export function loadShared(){
    const shared = sharedLibraryFile;
    sharedLibraryFile = "";
    return shared;
};
`;

if (!fs.existsSync(outputPath)){
    fs.mkdirSync(outputPath);
}

fs.unlinkSync(tempFilePath);
fs.writeFileSync(outputPath + 'Shared.js', formatted);