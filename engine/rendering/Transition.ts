export default class Transition{
    constructor(canvas){
        this._canvas = canvas;
        this._progress = 0;
        this._duration = 0;
        this._active = false;
        this.switchCallback = null;
        this.completeCallback = null;
    }

    get active(){return this._active}

    _normCos(x){
        return (-Math.cos(x * Math.PI * 2) + 1) / 2;
    }

    start(type, duration, switchCallback = null, completeCallback = null){
        this._active = true;
        this._progress = 0;
        this._duration = duration;
        this.switchCallback = switchCallback;
        this.completeCallback = completeCallback;
    }

    render(deltaTime){
        if (!this._active){
            return;
        }

        const ctx = this._canvas.getContext('2d');
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