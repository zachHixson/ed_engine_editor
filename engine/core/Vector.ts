import { Mat3 } from "./Mat3";

export interface ConstVector {
    readonly x: number;
    readonly y: number;
    clone(): Vector;
    dot(vec: ConstVector): number;
    cross(vec: ConstVector): number;
    distanceTo(vec: ConstVector): number;
    distanceNoSqrt(vec: ConstVector): number;
    length(): number;
    lengthNoSqrt(): number;
    magnitude(): number;
    equalTo(vec: ConstVector): boolean;
    toObject(): {x: number, y: number};
    toArray(): [number, number];
};

export class Vector implements ConstVector {
    x: number;
    y: number;

    constructor(x: number = 0, y: number = 0){
        this.x = x;
        this.y = y;
    }

    add(vec: ConstVector): Vector {
        this.x += vec.x;
        this.y += vec.y;
        return this;
    }

    addScalar(scalar: number): Vector {
        this.x += scalar;
        this.y += scalar;
        return this;
    }

    subtract(vec: ConstVector): Vector {
        this.x -= vec.x;
        this.y -= vec.y;
        return this;
    }

    subtractScalar(scalar: number): Vector {
        this.x -= scalar;
        this.y -= scalar;
        return this;
    }

    multiply(vec: ConstVector): Vector {
        this.x *= vec.x;
        this.y *= vec.y;
        return this;
    }

    scale(scalar: number): Vector {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    multiplyMat3(mat: Mat3): Vector {
        const x = this.x;
        const y = this.y;

        this.x = x * mat.data[0] + y * mat.data[3] + mat.data[6];
        this.y = x * mat.data[1] + y * mat.data[4] + mat.data[7];

        return this;
    }

    multiplyScalar(scalar: number): Vector {
        return this.scale(scalar);
    }

    divide(vec: ConstVector): Vector {
        this.x /= vec.x;
        this.y /= vec.y;
        return this;
    }

    divideScalar(scalar: number): Vector {
        this.x /= scalar;
        this.y /= scalar;
        return this;
    }

    dot(vec: ConstVector): number {
        return this.x * vec.x + this.y * vec.y;
    }

    cross(vec: ConstVector): number {
        return this.x * vec.y - this.y * vec.x;
    }

    magnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    length(): number {
        return this.magnitude();
    }

    lengthNoSqrt(): number {
        return this.x * this.x + this.y * this.y;
    }

    normalize(): Vector {
        const magnitude = this.magnitude();
        if (magnitude == 0) return this;
        return this.scale(1/magnitude);
    }

    copy(vec: { x: number, y: number }): Vector {
        this.x = vec.x;
        this.y = vec.y;
        return this;
    }

    set(x: number, y: number): Vector {
        this.x = x;
        this.y = y;
        return this;
    }

    clone(): Vector {
        return new Vector(this.x, this.y);
    }

    static fromArray(arr: number[]): Vector {
        return new Vector().fromArray(arr);
    }

    fromArray(arr: number[]): Vector {
        this.x = arr[0] ?? 0;
        this.y = arr[1] ?? 0;
        return this;
    }

    toArray(): [number, number] {
        return [this.x, this.y];
    }

    static fromObject(obj: {x: number, y: number}): Vector {
        return new Vector().fromObject(obj);
    }

    fromObject(obj: {x: number, y: number}): Vector {
        this.x = obj.x;
        this.y = obj.y;
        return this;
    }

    toObject(): {x: number, y: number} {
        return {x: this.x, y: this.y};
    }

    floor(): Vector {
        this.x = Math.floor(this.x);
        this.y = Math.floor(this.y);
        return this;
    }

    ceil(): Vector {
        this.x = Math.ceil(this.x);
        this.y = Math.ceil(this.y);
        return this;
    }

    round(): Vector {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this;
    }

    absolute(): Vector {
        this.x = Math.abs(this.x);
        this.y = Math.abs(this.y);

        return this;
    }

    equalTo(vec: ConstVector): boolean {
        return (
            this.x == vec.x &&
            this.y == vec.y
        );
    }

    distanceTo(vec: ConstVector): number {
        const dx = this.x - vec.x;
        const dy = this.y - vec.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    distanceNoSqrt(vec: ConstVector): number {
        const dx = this.x - vec.x;
        const dy = this.y - vec.y;
        return dx * dx + dy * dy;
    }

    randomize(lb: ConstVector, ub: ConstVector): Vector {
        const dx = ub.x - lb.x;
        const dy = ub.y - lb.y;
        this.x = Math.random() * dx + lb.x;
        this.y = Math.random() * dy + lb.y;
        return this;
    }

    zero(): Vector {
        this.x = this.y = 0;
        return this;
    }

    clampLength(maxLength: number): Vector {
        const curLength = this.length();
        const scaleFac = maxLength / curLength;

        if (curLength > maxLength){
            this.x *= scaleFac;
            this.y *= scaleFac;
        }

        return this;
    }

    reverse(): Vector {
        this.x ^= this.y;
        this.y ^= this.x;
        this.x ^= this.y;
        
        return this;
    }
}