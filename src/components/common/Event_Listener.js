function addEventListener(name, callback, options){
    let callbackList = this._events.get(name);

    if (!callbackList){
        callbackList = new Map();
        this._events.set(name, callbackList);
    }

    callbackList.set(callback, {
        callback,
        options
    });
}

function removeEventListener(name, callback){
    const callbackList = this._events.get(name);
    callbackList.delete(callback);
}

function dispatchEvent(event){
    const callbackList = this._events.get(event.type);

    callbackList?.forEach(({callback, options}) => {
        callback(event);

        if (options?.once){
            this.removeEventListener(callback);
        }
    })
}

export function mixinEventListener(parentClass){
    Object.assign(parentClass.prototype, {
        _events: new Map(),
        addEventListener,
        removeEventListener,
        dispatchEvent
    });
}