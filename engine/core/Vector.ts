export class Vector {
    x: number;
    y: number;

    constructor(x: number = 0, y: number = 0){
        this.x = x;
        this.y = y;
    }

    add(vec: Vector): Vector {
        this.x += vec.x;
        this.y += vec.y;
        return this;
    }

    addScalar(scalar: number): Vector {
        this.x += scalar;
        this.y += scalar;
        return this;
    }

    subtract(vec: Vector): Vector {
        this.x -= vec.x;
        this.y -= vec.y;
        return this;
    }

    subtractScalar(scalar: number): Vector {
        this.x -= scalar;
        this.y -= scalar;
        return this;
    }

    multiply(vec: Vector): Vector {
        this.x *= vec.x;
        this.y *= vec.y;
        return this;
    }

    scale(scalar: number): Vector {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    multiplyScalar = this.scale;

    divide(vec: Vector): Vector {
        this.x /= vec.x;
        this.y /= vec.y;
        return this;
    }

    divideScalar(scalar: number): Vector {
        this.x /= scalar;
        this.y /= scalar;
        return this;
    }

    dot(vec: Vector): number {
        return this.x * vec.x + this.y * vec.y;
    }

    cross(vec: Vector): number {
        return this.x * vec.y - this.y * vec.x;
    }

    magnitude(): number {
        return Math.sqrt(this.dot(this));
    }

    length = this.magnitude;

    normalize(): Vector {
        const magnitude = this.magnitude();
        return this.scale(1/magnitude);
    }

    copy(vec: Vector): Vector {
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

    toArray(): number[] {
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

    equalTo(vec: Vector): boolean {
        return (
            this.x == vec.x &&
            this.y == vec.y
        );
    }

    distanceTo(vec: Vector): number {
        const dx = this.x - vec.x;
        const dy = this.y - vec.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}