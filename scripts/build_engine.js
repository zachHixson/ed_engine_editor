const uglify = require('uglify-js');
const fs = require('fs');
const {execSync} = require('child_process');
const rollupConfig = require('../engine/rollup.config.js');

execSync('npx rollup --config ./engine/rollup.config.js');

const debug = process.argv.includes('--debug');
const tempFilePath = rollupConfig[0].output.file;
const rolledEngine = fs.readFileSync(tempFilePath, {encoding: 'utf-8'});
const minifiedEngine = debug ? rolledEngine : uglify.minify(rolledEngine, {output: {quote_style: 2}}).code;
const formatted = `
let engineCode = \`${
    minifiedEngine.replace(/\\/g, "\\\\")
    .replace(/\$/g, "\\$")
    .replace(/'/g, "\\'")
    .replace(/"/g, "\\\"")
}\`;

export function loadEngine(){
    const engine = engineCode;
    engineCode = "";
    return engine;
};`;

fs.unlinkSync(tempFilePath);
fs.writeFileSync('./_compiled/engine.js', formatted);