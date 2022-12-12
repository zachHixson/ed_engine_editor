const request = require('request');
const fs = require('fs');
const {createCanvas, loadImage} = require('canvas');
const fontURL = 'https://gist.githubusercontent.com/zachHixson/6f25bbf77680372a7b819383e3f25a1a/raw/ed_engine_font';
const outputPath = './_compiled/';
const fileName = 'FontData.js';
const charWidth = 7;
const charHeight = 9;
const B64_ALPH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

(()=>{
    if (process.argv.length <= 2){
        defaultBuild();
    }
    else if (process.argv.includes('--fromFiles')){
        buildFromFiles();
    }
    else if (process.argv.includes('--o')){
        gistToFiles();
    }
    else if (process.argv.includes('--help')){
        printHelp();
    }
    else{
        console.error('ERROR: Unrecognized arguments, aborting');
    }
})();

function defaultBuild(){
    getFontGist((rawGist)=>{
        writeFontDataFile('let fontData = ' + rawGist + ';');
    });
}

function buildFromFiles(){
    const argIdx = process.argv.indexOf('--fromFiles')
    const [pathToKey, pathToImage] = (()=>{
        const arg1 = process.argv[argIdx + 1];
        const arg2 = process.argv[argIdx + 2];
        return arg1.includes('.txt') ? [arg1, arg2] : [arg2, arg1];
    })();
    let charKey;

    if (!(pathToKey.includes('.txt') && pathToImage.includes('.png'))){
        console.error('Invalid file type. Key must be .txt, and image must be .png');
        return;
    }

    charKey = fs.readFileSync(pathToKey, {encoding: 'utf-8'});
    charKey = charKey.replace('\\', '\\\\');
    charKey = charKey.replace('"', '\\"');

    loadImage(pathToImage).then(image => {
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const bitmap = getBitmap(imgData);
        const encoded = encode(bitmap);

        const output = `let fontData = {
            "width": ${image.width},
            "height": ${image.height},
            "charWidth": ${charWidth},
            "charHeight": ${charHeight},
            "charKey": "${charKey}",
            "data": ${JSON.stringify(encoded)}
        };`;
        writeFontDataFile(output);

        if (process.argv.includes('--log')){
            console.log(
                '\n\n',
                'key: "' + charKey + '"',
                '\n\n',
                'data: ' + JSON.stringify(encoded)
            );
        }
    });
}

function gistToFiles(){
    const outputPath = process.argv[process.argv.length - 1];

    if (!fs.existsSync(outputPath)){
        console.error('The specified path does not exist');
        return;
    }

    getFontGist((data)=>{
        const jsonRaw = data.replace('let fontData = ', '');
        const fontObj = JSON.parse(jsonRaw);
        const canvas = createCanvas(fontObj.width, fontObj.height);
        const decoded = decode(fontObj);
        const bitmapCanvas = bitmapToCanvas(decoded, canvas);
        const stream = bitmapCanvas.createPNGStream();
        const out = fs.createWriteStream(outputPath + 'font.png');

        fs.writeFileSync(outputPath + 'key.txt', fontObj.charKey);
        stream.pipe(out);
    });
}

function printHelp(){
    console.log(
`
args:
========
none:
    - Builds font file from gist and stores it in default directory

--fromFiles [path_to_key] [path_to_image] --log
    - Builds font file from specified image and key files. Stores result in default directory
    - Optional "--log" prints data to console to make for easy copy&pasting to gist.

--o [output_path]
    - downloads gist and stores image&key files in specified directory
    - Allows for easy editing of font data. Use "--fromFiles" when done.
`
    );
}

function getFontGist(callback){
    request.get(fontURL, (error, response, body)=>{
        if (error || !response.statusCode == 200){
            console.error(error);
            return;
        }

        callback(body);
    });
}

function getBitmap(imageData){
    const data = imageData.data;
    const bitmap = new Array(data.length / 4);

    for (let i = 0; i < bitmap.length; i++){
        bitmap[i] = (data[i * 4] > 0) + 0;
    }

    return bitmap;
}

function encode(bitmap){
    const bitPacked = packBits(bitmap);
    const compressZeros = rleZeros(bitPacked);
    const b64 = {
        compressed: compressZeros.compressed.map(i => b64_encode(i)).toString(),
        zeroData: compressZeros.zeroData.map(i => b64_encode(i)).toString()
    };
    return b64;
}

function decode(fontObj){
    const b64ToNumeric = {
        compressed: fontObj.data.compressed.split(',').map(i => b64_decode(i)),
        zeroData: fontObj.data.zeroData.split(',').map(i => b64_decode(i))
    };
    const decompZeros = rldZeros(b64ToNumeric.compressed, b64ToNumeric.zeroData);
    const bitUnpacked = unpackBits(decompZeros);
    return bitUnpacked;
}

function packBits(bitmap){
    const finalLength = Math.ceil((bitmap.length / 32));
    const packedArr = new Array(finalLength);
    let bitIdx = 0;

    for (let i = 0; i < packedArr.length; i++){
        let curPack = 0;

        for (let b = 0; b < 32; b++){
            curPack = (curPack << 1) >>> 0;
            curPack |= bitmap[bitIdx] ?? 0;
            curPack = curPack >>> 0;

            bitIdx++;
        }

        packedArr[i] = curPack;
    }

    return packedArr;
}

function unpackBits(packedArr){
    const unpacked = [];

    for (let i = packedArr.length - 1; i >= 0; i--){
        let curByte = packedArr[i];

        for (let j = 0; j < 32; j++){
            unpacked.push(curByte & 0b01);
            curByte = curByte >>> 1;
        }
    }

    return unpacked.reverse();
}

function rleZeros(bitmap){
    const compressed = [...bitmap];
    const zeroData = [];
    let curRunStart = 0;
    let curRunLength = 0;

    for (let i = 0; i < compressed.length; i++){
        if (compressed[i] == 0 && !(curRunLength > 0 && i == compressed.length - 1)){
            if (curRunLength == 0){
                curRunStart = i;
            }

            curRunLength++;
        }
        else if (curRunLength > (curRunStart.toString() + curRunLength.toString()).length + 2){
            compressed.splice(curRunStart, curRunLength);
            i -= curRunLength - 1;
            zeroData.push(curRunStart, curRunLength);
            curRunLength = 0;
        }
        else{
            curRunLength = 0;
        }
    }

    return {
        compressed,
        zeroData
    }
}

function rldZeros(compressed, zeroData){
    const decompressed = [...compressed];

    for (let i = zeroData.length - 1; i > 0; i -= 2){
        const start = zeroData[i - 1];
        const length = zeroData[i];
        const zeros = new Array(length).fill(0);
        decompressed.splice(start, 0, ...zeros);
    }

    return decompressed;
}

function b64_encode(number) {
    if (isNaN(Number(number)) || number === null ||
        number === Number.POSITIVE_INFINITY)
        throw "The input is not valid";
    if (number < 0)
        throw "Can't represent negative numbers now";

    var rixit;
    var residual = Math.floor(number);
    var result = '';
    while (true) {
        rixit = residual % 64
        result = B64_ALPH.charAt(rixit) + result;
        residual = Math.floor(residual / 64);
        if (residual == 0)
            break;
        }
    return result;
}

function b64_decode(rixits) {
    var result = 0;
    rixits = rixits.split('');
    for (var e = 0; e < rixits.length; e++) {
        result = (result * 64) + B64_ALPH.indexOf(rixits[e]);
    }
    return result;
}

function bitmapToCanvas(bitmap, canvas){
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(canvas.width, canvas.height);

    for (let i = 0; i < bitmap.length; i++){
        const imgIdx = i * 4;
        const luma = bitmap[i] * 255;
        imgData.data[imgIdx + 0] = luma;
        imgData.data[imgIdx + 1] = luma;
        imgData.data[imgIdx + 2] = luma;
        imgData.data[imgIdx + 3] = luma;
    }

    ctx.putImageData(imgData, 0, 0);

    return canvas;
}

function loadFontData(){
    const fontObj = fontData;
    fontData = null;
    return fontObj;
}

function stringifyFunction(func, exportFlag = false){
    const exportStr = exportFlag ? 'export ' : '';
    return '\n' + exportStr + func.toString() + ';\n';
}

function writeFontDataFile(fontData){
    let fileOutput = fontData + '\n';

    fileOutput += `\nconst B64_ALPH = "${B64_ALPH};"\n`;
    fileOutput += stringifyFunction(b64_decode);
    fileOutput += stringifyFunction(rldZeros);
    fileOutput += stringifyFunction(unpackBits);
    fileOutput += stringifyFunction(bitmapToCanvas, true);
    fileOutput += stringifyFunction(decode, true);
    fileOutput += '\nexport default ' + loadFontData.toString() + ';';

    if (!fs.existsSync(outputPath)){
        fs.mkdirSync(outputPath);
    }

    fs.writeFileSync(outputPath + fileName, fileOutput);
}