export interface Options {
    once?: boolean,
}

export class Event_Emitter <T extends (...args: any)=>void> {
    private _context: any;
    private _callbacks: ({cb: T, o: Options})[] = [];

    constructor(context: any = window){
        this._context = context;
    }

    listen(callback: T, options?: Options): void {
        this._callbacks.push({cb: callback, o: options ?? {}});
    }

    remove(callback: T): void {
        const idx = this._callbacks.findIndex(i => i.cb == callback);
        this._callbacks.splice(idx, 1);
    }

    clear(){
        this._callbacks = [];
    }

    emit(...args: Parameters<T>): void;
    emit(){
        for (let i = 0; i < this._callbacks.length; i++){
            const {cb, o} = this._callbacks[i];
            cb.apply(this._context, arguments as unknown as any[]);

            if (o.once){
                this.remove(cb);
                i--;
            }
        }
    }
}