export default class Transition{
    private _canvas: HTMLCanvasElement;
    private _progress: number = 0;
    private _duration: number = 0;
    private _active: boolean = false;
    private switchCallback: (()=>void) | null = null;
    private completeCallback: (()=>void) | null = null;

    constructor(canvas: HTMLCanvasElement){
        this._canvas = canvas;
    }

    get active(){return this._active}

    private _normCos(x: number){
        return (-Math.cos(x * Math.PI * 2) + 1) / 2;
    }

    start(type: any, duration: number, switchCallback: ()=>void, completeCallback: ()=>void): void {
        this._active = true;
        this._progress = 0;
        this._duration = duration;
        this.switchCallback = switchCallback;
        this.completeCallback = completeCallback;
    }

    render(deltaTime: number): void {
        if (!this._active){
            return;
        }

        const ctx = this._canvas.getContext('2d')!;
        const fac = Math.min(this._progress / this._duration, 1);
        const opacity = this._normCos(fac);

        ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
        ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);

        if (fac >= 0.5 && this.switchCallback){
            this.switchCallback();
            this.switchCallback = null;
        }

        if (fac == 1.0){
            this._active = false;

            if (this.completeCallback){
                this.completeCallback();
                this.completeCallback = null;
            }
        }

        this._progress = Math.min(this._progress + deltaTime, this._duration);
    }
}