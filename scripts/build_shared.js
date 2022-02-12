const uglify = require('uglify-js');
const fs = require('fs');
const glob = require('glob');

const sharedPath = './shared';
const outputPath = './compiled/';
const victorPath = require.resolve('victor');

//gather file contents
let victorFile = fs.readFileSync(victorPath, {encoding:'utf8', flag:'r'});
victorFile = victorFile.replace('exports = module.exports = Victor;', '');
victorFile = uglify.minify(victorFile).code;

const sharedPaths = glob.sync(sharedPath + '/**/*.js');
let sharedContents = victorFile;

sharedContents += `
window.Shared = {};

function waitForSharedDependencies(depsList, callback){
    let timeout = 50;

    const check = ()=>{
        let passed = true;
        depsList.forEach(d => passed &= Shared.hasOwnProperty(d));

        if (timeout <= 0){
            console.error('Timeout: Could not find all deps of ' + depsList);
            return;
        }

        if (passed){
            callback();
        }
        else{
            setTimeout(check);
            timeout--;
        }
    };

    check();
};
`;

sharedPaths.forEach(path => {
    const fileContents = fs.readFileSync(path, {encoding:'utf8', flag:'r'});
    sharedContents += fileContents;
});

const debug = process.argv.includes('--debug');
const sharedMinified = debug ? sharedContents : uglify.minify(sharedContents, {output: {quote_style: 2}}).code;
const formatted = `
let sharedLibraryFile = \`${sharedMinified}\`;

export function loadShared(){
    const shared = sharedLibraryFile;
    sharedLibraryFile = "";
    return shared;
};
`;

if (!fs.existsSync(outputPath)){
    fs.mkdirSync(outputPath);
}

fs.writeFileSync(outputPath + 'sharedLibrary.js', formatted);