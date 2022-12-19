export function EventListenerMixin(superclass = class{}){
    return class extends superclass {
        constructor(args){
            super(args);
            this._events = new Map();
        }

        addEventListener(name, callback, options){
            const lName = name.toLowerCase();
            let callbackList = this._events.get(lName);
        
            if (!callbackList){
                callbackList = new Map();
                this._events.set(lName, callbackList);
            }
        
            callbackList.set(callback, {
                callback,
                options
            });
        }
        
        removeEventListener(name, callback){
            const callbackList = this._events.get(name.toLowerCase());
            callbackList.delete(callback);
        }
        
        dispatchEvent(event){
            const callbackList = this._events.get(event.type.toLowerCase());
        
            callbackList?.forEach(({callback, options}) => {
                callback(event);
        
                if (options?.once){
                    this.removeEventListener(callback);
                }
            });
        }
    }
}