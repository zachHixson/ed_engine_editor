import Linked_List from '../Linked_List';

class Instance_Collection{
    constructor(area, divisions){
        this.area = area;
        this.divisions = divisions;
        this.instances = new Linked_List();
        this.zSort = new Linked_List();
        this.spacialGrid = new Array(area / divisions);
    }

    addInstance(objRef, pos){
        let newInstance = new Instance(0, objRef, pos);
        this.instances.push(newInstance);
        this.zSort.push(newInstance);
    }

    resortZ(){
        this.zSort.sort((a, b) => a.zDepth < b.zDepth);
    }
}

export default Instance_Collection;