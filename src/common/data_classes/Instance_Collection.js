import Linked_List from '../Linked_List';
import Instance from './Instance';

class Instance_Collection{
    constructor(area, cellSize){
        this.curInstId = 0;
        this.area = area;
        this.cellSize = cellSize;
        this.cellCount = this.area / this.cellSize;
        this.zSort = new Linked_List();
        this.spacialGrid = new Array(Math.ceil(this.cellCount * this.cellCount));
        
        for (let i = 0; i < this.spacialGrid.length; i++){
            this.spacialGrid[i] = new Linked_List();
        }
    }

    addInstance(objRef, pos){
        let instNodeRef;
        let newInstance = new Instance(this.curInstId++, objRef, pos);
        let spacialIdx = this.getSpacialCellIdx(pos);
        this.zSort.push(newInstance);
        instNodeRef = this.zSort.getLastNodeRef();
        this.spacialGrid[spacialIdx].push(instNodeRef);
        this.resortZ();

        return newInstance;
    }

    removeInstance(instId, pos = null){
        let instRef = null;
        let spacialIdx;
        let cellList;
        let cellRef;

        if (pos){
            spacialIdx = this.getSpacialCellIdx(pos);
            cellList = this.spacialGrid[spacialIdx];
            instRef = cellList.findRef(instId, (i) => i.val.id);
            
            cellList.removeByNodeRef(instRef);
            this.zSort.removeByNodeRef(instRef.val);
        }
        else{
            instRef = this.zSort.findRef(instId, (i) => i.id);
            spacialIdx = this.getSpacialCellIdx(instRef.val.pos);
            cellList = this.spacialGrid[spacialIdx];
            cellRef = cellList.findRef(instId, (i) => i.val.id);

            this.zSort.removeByNodeRef(instRef);
            cellList.removeByNodeRef(cellRef);
        }

        return instRef.val.val;
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

    getInstanceById(instId){
        return this.zSort.find(instId, (i) => i.id);
    }

    getInstancesInRadius({x, y}, radius){
        let outputInsts = [];
        let cellRadius = Math.floor(radius / this.cellSize) * this.cellSize;
        
        for (let xCell = x - cellRadius; xCell <= x + cellRadius; xCell += this.cellSize){
            for (let yCell = y - cellRadius; yCell <= y + cellRadius; yCell += this.cellSize){
                let idx = this.getSpacialCellIdx({x:xCell, y:yCell});

                if (idx > 0 && idx < this.spacialGrid.length - 1){
                    let cellList = this.spacialGrid[idx].toArray();
                    
                    for (let i = 0; i < cellList.length; i++){
                        outputInsts.push(cellList[i].val);
                    }
                }
            }
        }

        return outputInsts;
    }

    setInstancePosition(instRef, newPos){
        let startSpacialIdx = this.getSpacialCellIdx(instRef.pos);
        let newSpacialIdx = this.getSpacialCellIdx(newPos);

        if (startSpacialIdx != newSpacialIdx){
            let startSpacialCell = this.spacialGrid[startSpacialIdx];
            let newSpacialCell = this.spacialGrid[newSpacialIdx];
            let spacialRef = startSpacialCell.findRef(instRef.id, (i) => i.val.id);

            startSpacialCell.removeByNodeRef(spacialRef);
            newSpacialCell.push(spacialRef.val);
        }

        instRef.pos.copy(newPos);
    }
}

export default Instance_Collection;