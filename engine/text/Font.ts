//@ts-nocheck
import loadFontData, { decode } from "@compiled/FontData";

export interface FontData {
    width: number;
    height: number;
    charWidth: number;
    charHeight: number;
    charKey: string;
    data: number[];
}

function decodeFont(): FontData {
    const fontData = loadFontData();
    const decoded = decode(fontData);
    const { width, height, charWidth, charHeight, charKey } = fontData;

    return {
        width,
        height,
        charWidth,
        charHeight,
        charKey,
        data: decoded.map(i => i * 255),
    };
}

export default decodeFont();