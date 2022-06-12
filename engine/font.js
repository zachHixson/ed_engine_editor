import loadFontData, {tokenizeData, rleDecode, bitmapToCanvas} from "../_compiled/FontData";

function getCharacterObject(charList, canvas, charWidth, charHeight){
    const ctx = canvas.getContext('2d');
    const charObj = {};
    const rows = canvas.width / charWidth;

    for (let i = 0; i < charList.length; i++){
        const x = (i % rows) * charWidth;
        const y = Math.floor(i / rows) * charHeight;
        const char = ctx.getImageData(x, y, charWidth, charHeight);
        const newCanvas = Shared.createCanvas(charWidth, charHeight)
        const newCtx = newCanvas.getContext('2d');

        newCtx.putImageData(char, 0, 0);
        charObj[charList[i]] = newCanvas;
    }

    return charObj;
}

function renderCharacters(){
    const fontData = loadFontData();
    const canvas = Shared.createCanvas(fontData.width, fontData.height);
    const tokenized = tokenizeData(fontData.data);
    const decoded = rleDecode(tokenized);
    const bitmapCanvas = bitmapToCanvas(decoded, canvas);
    const characters = getCharacterObject(fontData.charKey, bitmapCanvas, fontData.charWidth, fontData.charHeight);

    return characters;
}

const font = renderCharacters();
export default font;