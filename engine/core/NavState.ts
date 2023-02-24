import { Vector } from "./Vector";
import { Mat3 } from "./Mat3";

export interface iNavState {
    offset: Vector;
    zoomFac: number;
    matrix: Mat3;
}

export interface iNavSaveData {
    offset: { x: number, y: number },
    zoomFac: number,
}

export class NavState implements iNavState {
    private static _defaultMatrix = [1, 0, 0, 0, 1, 0, 1, 1, 1];

    private _offset: Vector = new Vector();
    private _zoomFac: number = 1;
    private _matrix = new Mat3(NavState._defaultMatrix);
    private _needsUpdate = false;

    get offset(){return this._offset}
    get zoomFac(){return this._zoomFac}
    get matrix(){
        if (this._needsUpdate){
            this.updateMatrix();
        }

        return this._matrix
    }

    setOffset(offset: Vector): void {
        this._offset.copy(offset);
        this._needsUpdate = true;
    }

    setZoom(zoom: number): void {
        this._zoomFac = zoom;
        this._needsUpdate = true;
    }

    updateMatrix(): void {
        this._matrix.data[0] = this._zoomFac;
        this._matrix.data[4] = this._zoomFac;

        this._matrix.data[2] = this._offset.x;
        this._matrix.data[5] = this._offset.y;

        this._needsUpdate = false;
    }

    reset(): void {
        this._offset.set(0, 0);
        this._zoomFac = 1;
        this._matrix.set(NavState._defaultMatrix);
        this._needsUpdate = false;
    }

    copy(newState: NavState | iNavState | iNavSaveData): void {
        this._offset.copy(newState.offset);
        this._zoomFac = newState.zoomFac;
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
    newNavState.setOffset(Vector.fromObject(navData.offset));
    newNavState.setZoom(navData.zoomFac);
    return newNavState;
}