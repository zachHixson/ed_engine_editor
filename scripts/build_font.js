const request = require('request');
const fs = require('fs');
const {createCanvas, loadImage} = require('canvas');
const fontURL = 'https://gist.githubusercontent.com/zachHixson/6f25bbf77680372a7b819383e3f25a1a/raw/ed_engine_font';
const outputPath = './_compiled/';
const fileName = 'FontData.js';
const charWidth = 7;
const charHeight = 9;

(()=>{
    if (process.argv.length <= 2){
        getFontGist((rawGist)=>{
            writeFontDataFile('let fontData = ' + rawGist + ';');
        });
    }
    else if (process.argv.includes('--fromFiles')){
        const argIdx = process.argv.indexOf('--fromFiles')
        const pathToKey = process.argv[argIdx + 1];
        const pathToImage = process.argv[argIdx + 2];
        let charKey;

        if (process.argv.length < 5){
            console.error('Invalid arguments. \'--fromFiles\' requres [pathToKey] and [pathToImage] args');
        }

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
            const rle = rleEncode(bitmap);
            const sanitized = sanitizeBitmapRLE(rle);
            const joined = sanitized.join('');
            const output = `let fontData = {
                "width": ${image.width},
                "height": ${image.height},
                "charWidth": ${charWidth},
                "charHeight": ${charHeight},
                "charKey": "${charKey}",
                "data": "${joined}"
            };`;
            writeFontDataFile(output);

            if (process.argv.includes('-o')){
                console.log(
                    '\n\n',
                    'key: "' + charKey + '"',
                    '\n\n',
                    'data: "' + joined + '"'
                );
            }
        });
    }
    else if (process.argv.includes('--toFiles')){
        const outputPath = process.argv[process.argv.length - 1];

        if (!fs.existsSync(outputPath)){
            console.error('The specified path does not exist');
            return;
        }

        getFontGist((data)=>{
            const jsonRaw = data.replace('let fontData = ', '');
            const fontObj = JSON.parse(jsonRaw);
            const canvas = createCanvas(fontObj.width, fontObj.height);
            const tokenized = tokenizeData(fontObj.data);
            const decompressed = rleDecode(tokenized);
            const desanitized = desanitizeBitmapRLE(decompressed);
            const bitmapCanvas = bitmapToCanvas(desanitized, canvas);
            const stream = bitmapCanvas.createPNGStream();
            const out = fs.createWriteStream(outputPath + 'font.png');

            fs.writeFileSync(outputPath + 'key.txt', fontObj.charKey);
            stream.pipe(out);
        });
    }
})();

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

function bitmapToCanvas(bitmap, canvas){
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(canvas.width, canvas.height);

    for (let i = 0; i < bitmap.length; i++){
        const imgIdx = i * 4;
        imgData.data[imgIdx + 0] = bitmap[i] * 255;
        imgData.data[imgIdx + 1] = bitmap[i] * 255;
        imgData.data[imgIdx + 2] = bitmap[i] * 255;
        imgData.data[imgIdx + 3] = (bitmap[i] > 0) * 255;
    }

    ctx.putImageData(imgData, 0, 0);

    return canvas;
}

function tokenizeData(data){
    const tokens = [];
    let token = '';

    for (let i = 0; i < data.length; i++){
        const char = data.charAt(i);
        const int = parseInt(char);
        const isNum = !isNaN(int);

        if (isNum){
            token += char;
        }

        if (!isNum || i == data.length - 1){
            if (token.length > 0){
                tokens.push(parseInt(token));
                token = '';
            }

            if (char == 'a'){
                tokens.push(1);
            }
            else{
                tokens.push(0);
            }
        }
    }

    return tokens;
}

function rleEncode(arr){
    const bitmap = [...arr];
    let curIdx = 0;
    let readIdx = curIdx + 1;

    while (readIdx < bitmap.length){
        let spreadLength = 0;

        while (bitmap[readIdx++] == bitmap[curIdx]){
            spreadLength++;
        }

        if (spreadLength > 1){
            bitmap.splice(curIdx + 1, spreadLength, spreadLength);
            curIdx += 2;
            readIdx = curIdx + 1;
        }
        else{
            curIdx = readIdx - 1;
            readIdx = curIdx + 1;
        }
    }

    return bitmap;
}

function rleDecode(arr){
    const bitmap = [...arr];

    for (let i = 0; i < bitmap.length; i++){
        const bit = bitmap[i];

        if (bit > 1){
            const spreadArr = new Array(bit).fill(bitmap[i - 1]);
            bitmap.splice(i, 1, ...spreadArr);
            i += bit;
        }
    }

    return bitmap;
}

function sanitizeBitmapRLE(arr){
    const sanitized = [...arr];

    for (let i = 0; i < sanitized.length; i++){
        if (sanitized[i] == 1){
            sanitized[i] = 'a';
        }
        else if (sanitized[i] == 0){
            sanitized[i] = 'b';
        }
    }

    return sanitized;
}

function desanitizeBitmapRLE(arr){
    const desanitized = [...arr];

    for (let i = 0; i < desanitized.length; i++){
        if (desanitized[i] == 'a'){
            desanitized[i] = '1';
        }
        else if (desanitized[i] == 'b'){
            desanitized[i] = '0';
        }
    }

    return desanitized;
}

function stringifyFunction(func){
    return '\nexport ' + func.toString() + ';\n';
}

function writeFontDataFile(fontData){
    let fileOutput = fontData + `
        export default function loadFontData(){
            const fontObj = fontData;
            fontData = null;
            return fontObj;
        };
    `.replace(/\s{4}/g, '');

    fileOutput += stringifyFunction(tokenizeData);
    fileOutput += stringifyFunction(rleDecode);
    fileOutput += stringifyFunction(bitmapToCanvas);

    if (!fs.existsSync(outputPath)){
        fs.mkdirSync(outputPath);
    }

    fs.writeFileSync(outputPath + fileName, fileOutput);
}