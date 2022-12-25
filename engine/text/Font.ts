//@ts-ignore
import loadFontData, {decode, bitmapToCanvas} from "@compiled/FontData";
import { Draw } from "@engine/core/core";

export type FontObj = {[key: string]: HTMLCanvasElement};

function getCharacterObject(charList: string, canvas: HTMLCanvasElement, charWidth: number, charHeight: number): FontObj {
    const ctx = canvas.getContext('2d')!;
    const charObj = {} as FontObj;
    const rows = canvas.width / charWidth;

    for (let i = 0; i < charList.length; i++){
        const x = (i % rows) * charWidth;
        const y = Math.floor(i / rows) * charHeight;
        const char = ctx.getImageData(x, y, charWidth, charHeight);
        const newCanvas = Draw.createCanvas(charWidth, charHeight);
        const newCtx = newCanvas.getContext('2d')!;

        newCtx.putImageData(char, 0, 0);
        charObj[charList[i]] = newCanvas;
    }

    return charObj;
}

function renderCharacters(): FontObj {
    const fontData = loadFontData();
    const canvas = Draw.createCanvas(fontData.width, fontData.height);
    const decoded = decode(fontData);
    const bitmapCanvas = bitmapToCanvas(decoded, canvas);
    const characters = getCharacterObject(fontData.charKey, bitmapCanvas, fontData.charWidth, fontData.charHeight);

    return characters;
}

export default renderCharacters();