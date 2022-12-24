const fs = require('fs');
const {execSync} = require('child_process');
const outputPath = './_compiled/';
const typesPath = './_compiled/@engineTypes/';

process.argv.includes('--build-font') && execSync('npm run build-font');

require("esbuild").build({
    entryPoints: ['..\\engine\\Engine.ts'],
    outfile: '.\\_compiled\\engine_raw.js',
    format: 'iife',
    globalName: 'Engine',
    bundle: true,
    sourcemap: process.argv.includes('--debug') ? 'inline' : false,
    minify: true,
    watch: process.argv.includes('--watch'),
    loader: {".ts": "ts"}
})
.then(() => {
const tempFile = fs.readFileSync('./_compiled/engine_raw.js', {encoding: 'utf-8'});
const formatted =
`export const EngineRawText = \`${
    tempFile
    .replace('"use strict";var', '"use strict";')
    .replace(/\\/g, "\\\\")
    .replace(/\$/g, "\\$")
    .replace(/'/g, "\\'")
    .replace(/"/g, "\\\"")
    .replace(/`/g, "\\\`")
}\`;

export const Engine = (()=>{
    let Engine;
    eval(EngineRawText);
    return Engine.Engine;
})();
`;

if (!fs.existsSync(outputPath)){
    fs.mkdirSync(outputPath);
}

if (!fs.existsSync(typesPath)){
    fs.mkdirSync(typesPath);
}

fs.unlinkSync('./_compiled/engine_raw.js');
fs.writeFileSync(outputPath + 'Engine.js', formatted);

execSync('tsc --project .\\engine\\ --declaration true --declarationDir .\\_compiled\\@engineTypes\\ --emitDeclarationOnly')
});