import { Vec2, Mat3 } from "linearz";

const PRECISION = 100;

export type tNavSaveData = [number, number, number];
export type tNavData = [number, number, number, number, number, number, number, number, number];

export interface iNavState {
    offset: Vec2;
    zoomFac: number;
    matrix: Mat3;
}

export class NavState implements iNavState {
    private static _defaultMatrix: tNavData = [1, 0, 0, 0, 1, 0, 0, 0, 1];

    private _offset: Vec2 = new Vec2();
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

    setOffset(offset: Readonly<Vec2>): void {
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

    getInverse(): Mat3 {
        if (this._needsUpdate){
            this.updateMatrix();
        }

        return this._matrix.clone().inverse();
    }

    reset(): void {
        this._offset.set(0, 0);
        this._zoomFac = 1;
        this._matrix.set(NavState._defaultMatrix);
        this._needsUpdate = false;
    }

    copy(newState: NavState | iNavState): void {
        this._offset.copy(newState.offset);
        this._zoomFac = newState.zoomFac;
    }

    toSaveData(): [number, number, number] {
        const rounded = this.offset.clone().multiplyScalar(PRECISION).round().divideScalar(PRECISION);
        return [
            rounded.x,
            rounded.y,
            Math.round(this.zoomFac * PRECISION) / PRECISION
        ];
    }

    static fromSaveData(navData: tNavSaveData): NavState {
        const newNavState = new NavState();
        newNavState.setOffset(new Vec2(navData[0], navData[1]));
        newNavState.setZoom(navData[2]);
        return newNavState;
    }
}
