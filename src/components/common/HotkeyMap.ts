interface iEvent {
    keys: string[],
    callback: (...args: any)=>void,
    args: any[],
    releaseCallback: (...args: any)=>void,
    releaseArgs: any[],
}

export default class HotkeyMap{
    keymap: Map<string, boolean> = new Map<string, boolean>();
    events: iEvent[] = [];
    active: iEvent[] = [];
    enabled: boolean = false;

    mouseEnter(): void {
        this.enabled = true;
    }

    mouseLeave(): void {
        this.enabled = false;
    }

    mouseDown(event: MouseEvent): void {
        switch (event?.button){
            case 0:
                this.keymap.set('lmb', true);
                break;
            case 1:
                this.keymap.set('mmb', true);
                break;
            case 2:
                this.keymap.set('rmb', true);
        }

        this.detectKeyCombo(event as MouseEvent & KeyboardEvent);
    }

    mouseUp(event: MouseEvent): void {
        switch (event?.button){
            case 0:
                this.keymap.set('lmb', false);
                break;
            case 1:
                this.keymap.set('mmb', false);
                break;
            case 2:
                this.keymap.set('rmb', false);
                break;
            default:
                this.keymap.set('lmb', false);
                this.keymap.set('mmb', false);
                this.keymap.set('rmb', false);
        }
    }

    keyDown(event: KeyboardEvent): void {
        if (this.enabled){
            this.keymap.set(event.key.toLowerCase(), true);
            this.detectKeyCombo(event as MouseEvent & KeyboardEvent);
        }
    }

    keyUp(event: KeyboardEvent): void {
        this.keymap.set(event.key.toLowerCase(), false);
        this.releaseEvents(event as MouseEvent & KeyboardEvent);
    }

    detectKeyCombo(event: MouseEvent & KeyboardEvent): void {
        for (let i = 0; i < this.events.length; i++){
            const curEvent = this.events[i];
            const controlDown = +!!this.keymap.get('control');
            const altDown = +!!this.keymap.get('alt');
            const shiftDown = +!!this.keymap.get('shift');
            const modifiersDown = controlDown + altDown + shiftDown;
            let keysDown = 0;
            let modifiersRequired = 0;
 
            for (let key = 0; key < curEvent.keys.length; key++){
                modifiersRequired += +(curEvent.keys[key] == 'control');
                modifiersRequired += +(curEvent.keys[key] == 'alt');
                modifiersRequired += +(curEvent.keys[key] == 'shift');
                keysDown += +!!this.keymap.get(curEvent.keys[key]);
            }

            if (keysDown == curEvent.keys.length && modifiersRequired == modifiersDown){
                event.preventDefault();
                this.active.push(curEvent);
                curEvent.callback(...curEvent.args);
            }
        }
    }

    releaseEvents(event: MouseEvent & KeyboardEvent): void {
        for (let i = 0; i < this.active.length; i++){
            const curEvent = this.active[i];

            if (curEvent.keys.includes(event.key)){
                event.preventDefault();
                curEvent.releaseCallback(...curEvent.releaseArgs);
                i--;
            }

            this.active.splice(i, 1);
        }
    }

    bindKey(
        keys: string[],
        callback: (...args: any)=>void,
        args: any[] = [],
        releaseCallback: (...args: any)=>void = ()=>{},
        releaseArgs: any[] = []
    ): void {
        this.events.push({
            keys,
            callback,
            args,
            releaseCallback,
            releaseArgs
        });
    }

    checkKeys(keyArr: string[], combo: boolean = false): boolean {
        let keysActive = 0;

        for (let i = 0; i < keyArr.length; i++){
            if (combo){
                keysActive &= +!!this.keymap.get(keyArr[i]);
            }
            else{
                keysActive |= +!!this.keymap.get(keyArr[i]);
            }
        }

        return !!keysActive;
    }
}