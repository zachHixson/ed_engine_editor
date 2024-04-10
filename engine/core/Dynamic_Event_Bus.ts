type Callback = (event: any)=>void;

export interface Options {
    once?: boolean,
}

export class Dynamic_Event_Bus {
    private events = new Map<string, Map<Callback, {callback: Callback, options: Options}>>();

    addEventListener(name: string, callback: Callback, options: Options = {}){
        const lName = name.toLowerCase();
        let callbackList = this.events.get(lName);
    
        if (!callbackList){
            callbackList = new Map();
            this.events.set(lName, callbackList);
        }
    
        callbackList.set(callback, {
            callback,
            options
        });
    }
    
    removeEventListener(name: string, callback: Callback){
        const callbackList = this.events.get(name.toLowerCase());
        callbackList?.delete(callback);
    }
    
    emit(name: string, parameters?: any){
        const lName = name.toLowerCase();
        const callbackList = this.events.get(lName);
    
        callbackList?.forEach(({callback, options}) => {
            callback(parameters);
    
            if (options?.once){
                this.removeEventListener(lName, callback);
            }
        });
    }
}