class Linked_List{
    constructor(){
        this.start = null;
        this.end = null;
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
        if (this.start){
            return this.end.val;
        }

        return null;
    }

    push(val){
        if (this.start == null){
            let newNode = new Node(val);
            this.start = newNode;
            this.end = newNode;
        }
        else{
            let newNode = new Node(val, null, this.end);
            this.end.next = newNode;
            this.end = newNode;
        }

        this.length++;
    }

    pop(){
        if (this.end && this.end.prev){
            let returnVal = this.end.val;
            this.end = this.end.prev;
            this.end.next = null;
            return returnVal;
        }
        else{
            let returnVal = this.end.val;
            this.end = null;
            return returnVal;
        }
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
            let newNode = new Node(val, rNode, lNode);

            lNode.next = newNode;
            this.length++;
            return true;
        }
        else{
            return false;
        }
    }

    clear(){
        if (this.start){
            this._clear(this.start);
        }

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
    }

    _removeNode(node){
        if (node.prev){
            node.prev.next = node.next;
        }

        if (node.next){
            node.next.prev = node.prev;
        }
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
}

class Node{
    constructor(val, next = null, prev = null){
        this.val = val;
        this.next = next;
        this.prev = prev;
    }
}

export default Linked_List;