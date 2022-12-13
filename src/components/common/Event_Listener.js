function addEventListener(name, callback, options){
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

function removeEventListener(name, callback){
    const callbackList = this._events.get(name.toLowerCase());
    callbackList.delete(callback);
}

function dispatchEvent(event){
    const callbackList = this._events.get(event.type.toLowerCase());

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