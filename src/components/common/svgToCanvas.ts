import Core from '@/core';

type LoadedCallback = (canvas?: HTMLCanvasElement)=>void;

export default function svgToCanvas(rawSvg: string, dim: number, loadedCallback?: LoadedCallback): HTMLCanvasElement {
    const svgStaticDim = rawSvg
        .replace('width="100%"', `width="${dim}"`)
        .replace('height="100%"', `height="${dim}"`);
    const domURL = window.URL || window.webkitURL || window;
    const svg = new Blob([svgStaticDim], {type: 'image/svg+xml'});
    const img = new Image();
    const url = domURL.createObjectURL(svg);
    const canvas = Core.Draw.createCanvas(dim, dim);

    img.onload = ()=>{
        const ctx = canvas.getContext('2d')!;
        
        ctx.drawImage(img, 0, 0);
        domURL.revokeObjectURL(url);

        //debug
        loadedCallback && loadedCallback(canvas);
    }
    img.src = url;

    return canvas;
}