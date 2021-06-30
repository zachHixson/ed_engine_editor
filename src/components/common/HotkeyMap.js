export default class HotkeyMap{
    constructor(){
        this.keymap = new Map();
        this.events = [];
        this.active = [];
        this.enabled = false;
    }

    mouseEnter(){
        this.enabled = true;
    }

    mouseLeave(){
        this.enabled = false;
    }

    mouseDown(event){
        switch (event.which){
            case 1:
                this.keymap.set('lmb', true);
                break;
            case 2:
                this.keymap.set('mmb', true);
                break;
            case 3:
                this.keymap.set('rmb', true);
        }

        this.detectKeyCombo(event);
    }

    mouseUp(event){
        switch (event.which){
            case 1:
                this.keymap.set('lmb', false);
                break;
            case 2:
                this.keymap.set('mmb', false);
                break;
            case 3:
                this.keymap.set('rmb', false);
        }
    }

    keyDown(event){
        if (this.enabled){
            this.keymap.set(event.key.toLowerCase(), true);
            this.detectKeyCombo(event);
        }
    }

    keyUp(event){
        if (this.enabled){
            this.keymap.set(event.key.toLowerCase(), false);
            this.releaseEvents(event);
        }
    }

    detectKeyCombo(event){
        for (let i = 0; i < this.events.length; i++){
            let curEvent = this.events[i];
            let keysDown = 0;
            let modifiersRequired = 0;
            let modifiersDown = !!this.keymap.get('control') + !!this.keymap.get('alt') + !!this.keymap.get('shift');
 
            for (let key = 0; key < curEvent.keys.length; key++){
                modifiersRequired += (curEvent.keys[key] == 'control') ? 1 : 0;
                modifiersRequired += (curEvent.keys[key] == 'alt') ? 1 : 0;
                modifiersRequired += (curEvent.keys[key] == 'shift') ? 1 : 0;
                keysDown += !!this.keymap.get(curEvent.keys[key]);
            }

            if (keysDown == curEvent.keys.length && modifiersRequired == modifiersDown){
                event.preventDefault();
                this.active.push(curEvent);
                curEvent.callback(...curEvent.args);
            }
        }
    }

    releaseEvents(event){
        for (let i = 0; i < this.active.length; i++){
            let curEvent = this.active[i];

            if (curEvent.keys.includes(event.key)){
                event.preventDefault();
                curEvent.releaseCallback(...curEvent.releaseArgs);
                this.active.splice(i, 1);
                i--;
            }
        }
    }

    bindKey(keys, callback, args = [], releaseCallback = ()=>{}, releaseArgs = []){
        this.events.push({
            keys,
            callback,
            args,
            releaseCallback,
            releaseArgs
        });
    }

    checkKeys(keyArr, combo = false){
        let keysActive = false;

        for (let i = 0; i < keyArr.length; i++){
            if (combo){
                keysActive &= !!this.keymap.get(keyArr[i]);
            }
            else{
                keysActive |= !!this.keymap.get(keyArr[i]);
            }
        }

        return keysActive;
    }
}