import Core from '@/core';

export default class MipMap {
    private _maps = new Map<number, HTMLCanvasElement>();
    private _minRes: number;
    private _maxRes: number;
    private _minCanvas: HTMLCanvasElement;
    private _maxCanvas: HTMLCanvasElement;

    constructor(image: HTMLCanvasElement, minRes: number = 2, delayGeneration: boolean = false){
        const startingDim = Math.min(image.width, image.height);

        if (Math.log2(startingDim) % 1 != 0){
            console.warn('Warning: Generating MipMaps from images that are not a power of 2 can cause problems');
        }

        this._minRes = minRes;
        this._maxRes = startingDim;
        this._maxCanvas = image;
        this._maps.set(startingDim, image);

        if (!delayGeneration){
            this._generateMaps(image, minRes);
        }

        this._minCanvas = this._getMinCanvas();
    }

    generateMaps(): void {
        this._generateMaps(this._maxCanvas, this._minRes);
    }

    private _generateMaps(image: HTMLCanvasElement, minRes: number): void {
        const curDim = new Core.Vector(image.width, image.height).divideScalar(2);
        const smallSide = Math.min(curDim.x, curDim.y);

        if (smallSide >= minRes){
            const newCanvas = Core.Draw.createCanvas(curDim.x, curDim.y);
            const ctx = newCanvas.getContext('2d')!;

            ctx.scale(0.5, 0.5);
            ctx.drawImage(image, 0, 0, image.width, image.height);
            this._maps.set(smallSide, newCanvas);
            this._generateMaps(newCanvas, minRes);
        }
    }

    private _getMinCanvas(): HTMLCanvasElement {
        let lowest = this._maps.get(this._maxRes);

        this._maps.forEach((canvas) => {
            lowest = canvas;
        });

        return lowest!;
    }

    get(res: number): HTMLCanvasElement {
        const mapGet = this._maps.get(res);

        if (mapGet) return mapGet;

        return res > this._maxRes ? this._maxCanvas : this._minCanvas;
    }

    calcClosest(res: number): number {
        let closest = this._maxRes;

        this._maps.forEach((canvas, dim) => {
            if (dim < closest && dim > res){
                closest = dim;
            }
        });

        return closest;
    }
}