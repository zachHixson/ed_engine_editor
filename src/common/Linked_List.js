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
            let newNode = new Node(val);
            this.end.next = newNode;
            this.end = newNode;
        }

        this.length++;
    }

    pop(){
        if (this.start && this.start.next){
            let returnVal = null;
            let penultNode = this.start;

            while (penultNode.next && penultNode.next.next){
                penultNode = penultNode.next;
            }

            returnVal = penultNode.next.val;
            penultNode.next = null;
            this.end = penultNode;
            this.length--;
            return returnVal;
        }
        else if (this.start){
            let returnVal = this.start.val;
            this.start = null;
            this.end = null;
            this.length--;
            return returnVal;
        }
        else{
            return null;
        }
    }

    popFirst(){
        if (this.start){
            let returnVal = this.start.val;
            let secondNode = this.start.next;
            this.start = secondNode;
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
            let newNode = new Node(val, rNode);

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

    toArray(){
        let newArray = [];
        let curNode = this.start;

        while (curNode != null){
            newArray.push(curNode.val);
            curNode = curNode.next;
        }

        return newArray;
    }
}

class Node{
    constructor(val, next = null){
        this.val = val;
        this.next = next;
    }
}

export default Linked_List;