export class Linked_List<T>{
    private _start: Node<T> | null = null;
    private _end: Node<T> | null = null;
    private _lastInserted: Node<T> | null = null;
    private _length: number = 0;

    constructor(){
        this._start = null;
        this._end = null;
        this._lastInserted = null;
        this._length = 0;
    }

    get length(){return this._length}

    get(idx: number): T | null {
        let curNode = this._start;

        if (idx >= this._length){
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

    getFirst(): T | null {
        if (this._start){
            return this._start.val;
        }

        return null;
    }

    getLast(): T | null {
        if (this._end){
            return this._end.val;
        }

        return null;
    }

    getLastNodeRef(): Node<T> | null {
        return this._end;
    }

    getLastInsertedRef(): Node<T> | null {
        return this._lastInserted;
    }

    find(searchFunc = (a: T) => a == a): T | null {
        return this.findRef(searchFunc)?.val ?? null;
    }

    findRef(searchFunc = (a: T) => a == a): Node<T> | null {
        let current = this._start;

        while (current){
            if (searchFunc(current.val)){
                return current;
            }

            current = current.next;
        }

        return null;
    }

    push(val: T): void {
        let newNode;

        if (this._start == null){
            newNode = new Node(val);
            this._start = newNode;
            this._end = newNode;
        }
        else{
            newNode = new Node(val, null, this._end);
            this._end!.next = newNode;
            this._end = newNode;
        }

        this._lastInserted = newNode;

        this._length++;
    }

    pop(): T | null {
        if (this._end && this._end.prev){
            let returnVal = this._end.val;
            this._end = this._end.prev;
            this._end.next = null;
            length--;
            return returnVal;
        }
        else if (this._end){
            let returnVal = this._end.val;
            this._end = null;
            this._start = null;
            this._length = 0;
            return returnVal;
        }
        
        return null;
    }

    popFirst(): T | null {
        if (this._start){
            const returnVal = this._start.val;
            const secondNode = this._start.next;
            this._start = secondNode;
            if (secondNode) secondNode.prev = null;
            this._length--;
            return returnVal;
        }
        else{
            return null;
        }
    }

    insert(val: T, idx: number): boolean {
        let lNode = this._start;

        if (idx >= this._length){
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
            this._length++;
            this._lastInserted = newNode;
            return true;
        }
        else{
            return false;
        }
    }

    insertSorted(val: T, smallestFunc: (a: T, b: T) => boolean = (a, b) => a < b): Node<T> {
        let lNode = this._start;
        let rNode = lNode ? lNode.next : null;
        let newNode = null;

        if (!lNode){
            this._start = new Node(val);
            this._end = this._start;
            this._lastInserted = this._start;
            this._length++;
            return this._start;
        }

        while (lNode.next && smallestFunc(lNode.val, val)){
            lNode = lNode.next;
            rNode = lNode.next;
        }

        newNode = new Node(val, rNode, lNode)

        if (rNode){
            rNode.prev = newNode;
        }

        lNode.next = newNode;
        this._lastInserted = lNode.next;
        this._length++;
        return newNode;
    }

    clear(): void {
        if (this._start){
            this._clear(this._start);
        }

        this._start = null;
        this._end = null;
        this._length = 0;
    }

    private _clear(node: Node<T>): void {
        if (node.next){
            this._clear(node.next);
        }
        else{
            node.next = null;
        }
    }

    sort(smallestFunc: (a: T, b: T)=>boolean = (a, b) => a < b): void {
        let head = null;
        let tail = null;

        if (!this._start){
            return;
        }

        while (this._start){
            const smallest = this._findSmallestNode(smallestFunc)!;

            this._removeNode(smallest);

            if (tail){
                tail.next = smallest;
            }

            if (!head){
                head = smallest;
            }

            if (smallest == this._start){
                this._start = (this._start.next) ? this._start.next : null;
            }

            smallest.prev = tail;
            smallest.next = null;
            tail = smallest;
        }

        this._start = head;
        this._end = tail;
    }

    removeByNodeRef(nodeRef: Node<T>): void {
        this._removeNode(nodeRef);
    }

    private _removeNode(node: Node<T>): void {
        if (node == this._start){
            this._start = this._start.next;

            if (this._start){
                this._start.prev = null;
            }
        }

        if (node == this._end){
            this._end = this._end.prev;

            if (this._end){
                this._end.next = null;
            }
        }

        if (node.prev){
            node.prev.next = node.next;
        }

        if (node.next){
            node.next.prev = node.prev;
        }

        this._length--;
    }

    private _findSmallestNode(smallestFunc: (a: T, b: T)=>boolean = (a, b) => a < b): Node<T> | null {
        let smallest = this._start;
        let seeker = this._start?.next;

        while (seeker){
            if (smallestFunc(seeker.val, smallest!.val)){
                smallest = seeker;
            }

            seeker = seeker.next;
        }

        return smallest;
    }

    toArray(): T[] {
        let newArray = [];
        let curNode = this._start;

        while (curNode){
            newArray.push(curNode.val);
            curNode = curNode.next;
        }

        return newArray;
    }

    forEach(func: (e: T)=>void): void {
        let curNode = this._start;

        while (curNode){
            func(curNode.val);
            curNode = curNode.next;
        }
    }

    map(func: (e: T)=>T): void {
        let curNode = this._start;

        while (curNode){
            curNode.val = func(curNode.val);
            curNode = curNode.next;
        }
    }
};

class Node<T> {
    val: T;
    next: Node<T> | null;
    prev: Node<T> | null;

    constructor(val: T, next: Node<T> | null = null, prev: Node<T> | null = null){
        this.val = val;
        this.next = next;
        this.prev = prev;
    }
}