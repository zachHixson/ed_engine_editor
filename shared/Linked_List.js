Shared.Linked_List = class {
    constructor(){
        this.start = null;
        this.end = null;
        this.lastInserted = null;
        this.length = 0;
    }

    get(idx){
        let curNode = this.start;

        if (idx >= this.length){
            console.error("Error: Index " + idx + " out of bounds");
            return null;
        }

        while (curNode && idx > 0){
            curNode = curNode.next;
            idx--;
        }

        if (curNode){
            return curNode.val;
        }
        else{
            console.error("Error: could not retrieve value at index: " + idx);
            return null;
        }
    }

    getFirst(){
        if (this.start){
            return this.start.val;
        }

        return null;
    }

    getLast(){
        if (this.end){
            return this.end.val;
        }

        return null;
    }

    getLastNodeRef(){
        return this.end;
    }

    getLastInsertedRef(){
        return this.lastInserted;
    }

    find(val, accessFunc = (a) => a){
        return this.findRef(val, accessFunc).val;
    }

    findRef(val, accessFunc = (a) => a){
        let current = this.start;

        while (current){
            if (accessFunc(current.val) == val){
                return current;
            }

            current = current.next;
        }
    }

    push(val){
        let newNode;

        if (this.start == null){
            newNode = new this.Node(val);
            this.start = newNode;
            this.end = newNode;
        }
        else{
            newNode = new this.Node(val, null, this.end);
            this.end.next = newNode;
            this.end = newNode;
        }

        this.lastInserted = newNode;

        this.length++;
    }

    pop(){
        if (this.end && this.end.prev){
            let returnVal = this.end.val;
            this.end = this.end.prev;
            this.end.next = null;
            length--;
            return returnVal;
        }
        else if (this.end){
            let returnVal = this.end.val;
            this.end = null;
            this.start = null;
            this.length = 0;
            return returnVal;
        }
        
        return null;
    }

    popFirst(){
        if (this.start){
            let returnVal = this.start.val;
            let secondNode = this.start.next;
            this.start = secondNode;
            secondNode.prev = null;
            this.length--;
            return returnVal;
        }
        else{
            return null;
        }
    }

    insert(val, idx){
        let lNode = this.start;

        if (idx >= this.length){
            console.error("Error: Index " + idx + " out of bounds");
            return false;
        }

        while (lNode && idx - 1 > 0){
            lNode = lNode.next;
            idx--;
        }

        if (lNode){
            let rNode = lNode.next;
            let newNode = new this.Node(val, rNode, lNode);

            lNode.next = newNode;
            this.length++;
            this.lastInserted = newNode;
            return true;
        }
        else{
            return false;
        }
    }

    insertSorted(val, smallestFunc = (a, b) => a < b){
        let lNode = this.start;
        let rNode = lNode ? lNode.next : null;
        let newNode = null;

        if (!lNode){
            this.start = new this.Node(val);
            this.end = this.start;
            this.lastInserted = this.start;
            this.length++;
            return this.start;
        }

        while (lNode.next && smallestFunc(lNode.val, val)){
            lNode = lNode.next;
            rNode = lNode.next;
        }

        newNode = new this.Node(val, rNode, lNode)

        if (rNode){
            rNode.prev = newNode;
        }

        lNode.next = newNode;
        this.lastInserted = lNode.next;
        this.length++;
        return;
    }

    clear(){
        if (this.start){
            this._clear(this.start);
        }

        this.start = null;
        this.end = null;
        this.length = 0;
    }

    _clear(node){
        if (node.next){
            this._clear(node.next);
        }
        else{
            node.next = null;
        }
    }

    sort(smallestFunc = (a, b) => a < b){
        let head = null;
        let tail = null;

        while (this.start){
            let smallest = this._findSmallestNode(smallestFunc);

            this._removeNode(smallest);

            if (tail){
                tail.next = smallest;
            }

            if (!head){
                head = smallest;
            }

            if (smallest == this.start){
                this.start = (this.start.next) ? this.start.next : null;
            }

            smallest.prev = tail;
            smallest.next = null;
            tail = smallest;
        }

        this.start = head;
        this.end = tail;
    }

    removeByNodeRef(nodeRef){
        this._removeNode(nodeRef);
    }

    _removeNode(node){
        if (node == this.start){
            this.start = this.start.next;

            if (this.start){
                this.start.prev = null;
            }
        }

        if (node == this.end){
            this.end = this.end.prev;

            if (this.end){
                this.end.next = null;
            }
        }

        if (node.prev){
            node.prev.next = node.next;
        }

        if (node.next){
            node.next.prev = node.prev;
        }

        this.length--;
    }

    _findSmallestNode(smallestFunc = (a, b) => a < b){
        let smallest = this.start;
        let seeker = this.start?.next;

        while (seeker){
            if (smallestFunc(seeker.val, smallest.val)){
                smallest = seeker;
            }

            seeker = seeker.next;
        }

        return smallest;
    }

    toArray(){
        let newArray = [];
        let curNode = this.start;

        while (curNode){
            newArray.push(curNode.val);
            curNode = curNode.next;
        }

        return newArray;
    }

    forEach(func){
        let curNode = this.start;

        while (curNode){
            func(curNode.val);
            curNode = curNode.next;
        }
    }

    map(func){
        let curNode = this.start;

        while (curNode){
            curNode.val = func(curNode.val);
            curNode = curNode.next;
        }
    }

    Node = class {
        constructor(val, next = null, prev = null){
            this.val = val;
            this.next = next;
            this.prev = prev;
        }
    }
};