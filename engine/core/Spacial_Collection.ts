import { Linked_List, Node as LL_Node } from "./Linked_List";
import { Vector } from "./Vector";
import { mod } from './Util';
import { iAnyObj } from "./interfaces";

interface iSpacialObject {
    id: number,
    zDepth: number,
    pos: Vector,
    clone(): any,
    toSaveData?(): iAnyObj,
}

export class Spacial_Collection<T extends iSpacialObject> {
    private _size: number;
    private _divisions: number;
    private _cellDimensions: number;
    private _map: Map<number, Spacial_Reference<T>> = new Map();
    private _spacialGrid: Linked_List<Spacial_Reference<T>>[];

    constructor(size: number, divisions: number) {
        this._size = size;
        this._divisions = divisions;
        this._cellDimensions = this._size / this._divisions;
        this._spacialGrid = new Array(this._divisions * this._divisions);

        for (let i = 0; i < this._spacialGrid.length; i++){
            this._spacialGrid[i] = new Linked_List<Spacial_Reference<T>>();
        }
    }

    add(data: T){
        const spacialReference = new Spacial_Reference<T>(data, data.pos);
        const cellIdx = this._posToCellIdx(data.pos);
        const cell = this._spacialGrid[cellIdx];

        this._map.set(data.id, spacialReference);
        cell.push(spacialReference);

        spacialReference.gridNode = cell.getLastInsertedRef()!;
        spacialReference.gridCell = cell;
    }

    remove(id: number): T | null {
        const spacialRef = this._map.get(id);

        spacialRef?.gridCell?.removeByNodeRef(spacialRef.gridNode!);
        this._map.delete(id);

        return spacialRef?.data ?? null;
    }

    clone(recursive: boolean = false): Spacial_Collection<T> {
        const clone = new Spacial_Collection<T>(this._size, this._divisions);
        this._map.forEach(spacialRef => {
            const newData = recursive ? spacialRef.data.clone() : spacialRef.data;
            clone.add(newData)
        });
        return clone;
    }

    toArray(): T[] {
        const outArr = new Array(this._map.size);
        this._map.forEach((spacialRef, idx) => outArr[idx] = spacialRef.data);

        return outArr;
    }

    getById(id: number): T | null {
        return this._map.get(id)?.data ?? null;
    }

    getByRadius(pos: Vector, radius: number): T[] {
        const surveyCellCount = Math.floor(Math.max(radius, this._cellDimensions) / this._cellDimensions);
        const surveyGridSize = surveyCellCount * 2 + 1;
        const startPos = pos.clone().subtractScalar(surveyCellCount * this._cellDimensions);
        const foundItems: T[] = [];

        for (let y = 0; y < surveyGridSize; y++){
            for (let x = 0; x < surveyGridSize; x++){
                const offset = new Vector(x, y).scale(this._cellDimensions);
                const curPos = startPos.clone().add(offset);
                const curCellIdx = this._posToCellIdx(curPos);
                const curCell = this._spacialGrid[curCellIdx];

                curCell.forEach(spacialRef => foundItems.push(spacialRef.data));
            }
        }

        return foundItems;
    }

    updatePosition(id: number): void {
        const spacialRef = this._map.get(id);

        if (!spacialRef) return;
        
        const oldCellIdx = this._posToCellIdx(spacialRef.pos);
        const newCellIdx = this._posToCellIdx(spacialRef.data.pos);

        if (oldCellIdx == newCellIdx) return;

        const newGridCell = this._spacialGrid[newCellIdx];

        spacialRef.gridCell?.removeByNodeRef(spacialRef.gridNode!);
        newGridCell.push(spacialRef);
        spacialRef.gridCell = newGridCell;
        spacialRef.gridNode = newGridCell.getLastInsertedRef()!;
        spacialRef.pos.copy(spacialRef.data.pos);
    }

    private _posToCellIdx(pos: Vector): number {
        const boundedPos = new Vector(mod(pos.x, this._size), mod(pos.y, this._size));
        const cell = boundedPos.scale(1/this._cellDimensions).floor();
        return (cell.y * this._divisions) + cell.x;
    }
}

class Spacial_Reference<T> {
    data: T;
    pos: Vector;
    gridNode?: LL_Node<Spacial_Reference<T>>;
    gridCell?: Linked_List<Spacial_Reference<T>>;

    constructor(data: T, pos: Vector){
        this.data = data;
        this.pos = pos.clone();
    }
}