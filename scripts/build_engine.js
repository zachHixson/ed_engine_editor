const fs = require('fs');
const {execSync} = require('child_process');
const outputPath = './_compiled/';

process.argv.includes('--build-font') && execSync('npm run build-font');

require("esbuild").build({
    entryPoints: ['..\\engine\\Engine.ts'],
    outfile: '.\\_compiled\\engine_raw.js',
    format: 'iife',
    globalName: 'Exports',
    bundle: true,
    minify: true,
    watch: process.argv.includes('--watch'),
    loader: {".ts": "ts"}
})
.then(() => {
const templateFile = fs.readFileSync('./engine/export_template.html', {encoding: 'utf-8'});
const rawFile = fs.readFileSync('./_compiled/engine_raw.js', {encoding: 'utf-8'});
const formatted =
`export const EngineRawText = \`${
    rawFile
    .replace('var Exports', 'window.Exports')
    .replace(/\\/g, "\\\\")
    .replace(/\$/g, "\\$")
    .replace(/'/g, "\\'")
    .replace(/"/g, "\\\"")
    .replace(/`/g, "\\\`")
}\`;

export const HTMLTemplate = \`
${templateFile}\`;

export const {Engine, Core} = (()=>{
    eval(EngineRawText);
    const {Engine, Core} = window.Exports;
    delete window.Exports;
    return {Engine, Core};
})();
`;

if (!fs.existsSync(outputPath)){
    fs.mkdirSync(outputPath);
}

fs.unlinkSync('./_compiled/engine_raw.js');
fs.writeFileSync(outputPath + 'Engine.js', formatted);
});