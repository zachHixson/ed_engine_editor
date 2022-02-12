/*
    ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠
    This is completely cursed code.
    This class basically needs to be able to access
    data either by location, or by a loopable list.
    Due to Javascript not directly supporting pointers
    this is really hacked together and needs to be
    refactored.
    ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠
*/

Shared.Spacial_Collection = class {
    constructor(area, cellSize){
        this.area = area;
        this.cellSize = cellSize;
        this.cellCount = this.area / this.cellSize;
        this.zSort = new Shared.Linked_List();
        this.spacialGrid = new Array(Math.ceil(this.cellCount * this.cellCount));
        
        for (let i = 0; i < this.spacialGrid.length; i++){
            this.spacialGrid[i] = new Shared.Linked_List();
        }
    }

    toSaveData(){
        let rawInstances = this.zSort.toArray();
        let sanitizedInstances = [];

        for (let i = 0; i < rawInstances.length; i++){
            sanitizedInstances.push(rawInstances[i].toSaveData());
        }

        return sanitizedInstances;
    }

    add(data, pos){
        let nodeRef;
        let spacialIdx = this.getSpacialCellIdx(pos);

        this.zSort.insertSorted(data, (a, b) => a.zDepth <= b.zDepth);
        nodeRef = this.zSort.getLastInsertedRef();
        this.spacialGrid[spacialIdx].push(nodeRef);

        return data;
    }

    remove(id, pos = null){
        let instRef = null;
        let spacialIdx;
        let cellList;
        let cellRef;

        if (pos){
            spacialIdx = this.getSpacialCellIdx(pos);
            cellList = this.spacialGrid[spacialIdx];
            instRef = cellList.findRef(id, (i) => i.val.id);
            
            cellList.removeByNodeRef(instRef);
            this.zSort.removeByNodeRef(instRef.val);
        }
        else{
            instRef = this.zSort.findRef(id, (i) => i.id);
            spacialIdx = this.getSpacialCellIdx(instRef.val.pos);
            cellList = this.spacialGrid[spacialIdx];
            cellRef = cellList.findRef(id, (i) => i.val.id);

            this.zSort.removeByNodeRef(instRef);
            cellList.removeByNodeRef(cellRef);
        }

        return instRef.val.val;
    }

    resortZ(){
        if (this.zSort.length > 0 && this.zSort.getFirst().zDepth != undefined){
            this.zSort.sort((a, b) => a.zDepth < b.zDepth);
        }
    }

    getSpacialCellIdx({x, y}){
        let halfArea = this.area / 2;
        let offsetX = x + halfArea;
        let offsetY = y + halfArea;
        let cellX = Math.floor(offsetX / this.cellSize);
        let cellY = Math.floor(offsetY / this.cellSize);
        let cellIdx = (cellY * this.cellCount) + cellX;
        return Math.floor(Shared.mod(cellIdx, this.spacialGrid.length));
    }

    getById(instId){
        if (this.zSort.getFirst().hasOwnProperty(id)){
            return this.zSort.find(instId, (i) => i.id);
        }
        else{
            return null;
        }
    }

    getByRadius({x, y}, radius){
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

    setPositionByRef(instRef, newPos){
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
};