import { Vector } from "./Vector";

export interface iNavState {
    zoomFac: number;
    offset: Vector;
}

export interface iNavSaveData {
    offset: { x: number, y: number },
    zoomFac: number,
}

export class NavState implements iNavState {
    offset: Vector = new Vector();
    zoomFac: number = 1;

    reset(): void {
        this.offset.set(0, 0);
        this.zoomFac = 1;
    }

    copy(newState: NavState | iNavState | iNavSaveData): void {
        this.offset.copy(newState.offset);
        this.zoomFac = newState.zoomFac;
    }
}

export function getNavSaveData(navState: NavState){
    return {
        offset: navState.offset.toObject(),
        zoomFac: navState.zoomFac,
    }
}

export function parseNavSaveData(navData: iNavSaveData): NavState {
    const newNavState = new NavState();
    newNavState.offset = Vector.fromObject(navData.offset);
    newNavState.zoomFac = navData.zoomFac;
    return newNavState;
}