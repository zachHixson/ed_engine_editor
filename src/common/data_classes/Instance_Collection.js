import Linked_List from '../Linked_List';
import Instance from './Instance';

class Instance_Collection{
    constructor(area, cellSize){
        this.area = area;
        this.cellSize = cellSize;
        this.cellCount = this.area / this.cellSize;
        this.instances = new Linked_List();
        this.zSort = new Linked_List();
        this.spacialGrid = new Array(Math.ceil(this.cellCount * this.cellCount));
        
        for (let i = 0; i < this.spacialGrid.length; i++){
            this.spacialGrid[i] = new Linked_List();
        }
    }

    addInstance(objRef, pos){
        let newInstance = new Instance(0, objRef, pos);
        let spacialIdx = this.getSpacialCellIdx(pos);
        this.instances.push(newInstance);
        this.zSort.push(newInstance);
        this.spacialGrid[spacialIdx].push(newInstance);
    }

    resortZ(){
        this.zSort.sort((a, b) => a.zDepth < b.zDepth);
    }

    getSpacialCellIdx({x, y}){
        let halfArea = this.area / 2;
        let offsetX = x + halfArea;
        let offsetY = y + halfArea;
        let cellX = Math.floor(offsetX / this.cellSize);
        let cellY = Math.floor(offsetY / this.cellSize);
        return (cellY * this.cellCount) + cellX;
    }

    getObjectsInRadius({x, y}, radius){
        let outputObjs = [];
        let cellRadius = Math.floor(radius / this.cellSize) * this.cellSize;
        
        for (let xCell = x - cellRadius; xCell <= x + cellRadius; xCell += this.cellSize){
            for (let yCell = y - cellRadius; yCell <= y + cellRadius; yCell += this.cellSize){
                let idx = this.getSpacialCellIdx({x:xCell, y:yCell});

                if (idx > 0 && idx < this.spacialGrid.length - 1){
                    outputObjs.push(...this.spacialGrid[idx].toArray());
                }
            }
        }

        return outputObjs;
    }
}

export default Instance_Collection;