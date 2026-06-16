export class Mat3 {
    private static _buffer1 = new Array<number>(9);

    private _data = [
        1, 0, 0,
        0, 1, 0,
        0, 0, 1,
    ];

    constructor(data?: Array<number>){
        if (!data) return;

        this.set(data);
    }

    get data(){return this._data}

    private _copyToDest(src: Array<number>, dest: Array<number>): Array<number> {
        dest[0] = src[0];
        dest[1] = src[1];
        dest[2] = src[2];
        dest[3] = src[3];
        dest[4] = src[4];
        dest[5] = src[5];
        dest[6] = src[6];
        dest[7] = src[7];
        dest[8] = src[8];

        return dest;
    }

    set(data: Array<number>): Mat3 {
        if (data.length != 9){
            console.error('Error: Mat3 requires 9 element array, ' + data.length + ' provided');
        }

        this._copyToDest(data, this._data);

        return this;
    }

    multiply(mat: Mat3): Mat3 {
        let swap1;
        let swap2;
        let swap3;

        swap1 = this._data[0];
        swap2 = this._data[1];
        swap3 = this._data[2];
        this._data[0] = swap1 * mat._data[0] + swap2 * mat._data[3] + swap3 * mat._data[6];
        this._data[1] = swap1 * mat._data[1] + swap2 * mat._data[4] + swap3 * mat._data[7];
        this._data[2] = swap1 * mat._data[2] + swap2 * mat._data[5] + swap3 * mat._data[8];

        swap1 = this._data[3];
        swap2 = this._data[4];
        swap3 = this._data[5];
        this._data[3] = swap1 * mat._data[0] + swap2 * mat._data[3] + swap3 * mat._data[6];
        this._data[4] = swap1 * mat._data[1] + swap2 * mat._data[4] + swap3 * mat._data[7];
        this._data[5] = swap1 * mat._data[2] + swap2 * mat._data[5] + swap3 * mat._data[8];

        swap1 = this._data[6];
        swap2 = this._data[7];
        swap3 = this._data[8];
        this._data[6] = swap1 * mat._data[0] + swap2 * mat._data[3] + swap3 * mat._data[6];
        this._data[7] = swap1 * mat._data[1] + swap2 * mat._data[4] + swap3 * mat._data[7];
        this._data[8] = swap1 * mat._data[2] + swap2 * mat._data[5] + swap3 * mat._data[8];

        return this;
    }

    determinant(): number {
        return (
            this._data[0] * (this._data[4] * this._data[8] - this._data[5] * this._data[7]) -
            this._data[1] * (this._data[3] * this._data[8] - this._data[5] * this._data[6]) +
            this._data[2] * (this._data[3] * this._data[7] - this._data[4] * this._data[6])
        );
    }

    inverse(): Mat3 {
        const det = this.determinant();

        if (det == 0){
            console.error('Cannot get inverse of matrix if determinant is 0');
            return new Mat3([...this._data]);
        }

        //calculate determinants using "matrix of minors" and apply "checkeerboard" +/-
        const original = this._copyToDest(this._data, Mat3._buffer1);
        this._data[0] = original[4] * original[8] - original[7] * original[5];
        this._data[1] = -(original[3] * original[8] - original[6] * original[5]);
        this._data[2] = original[3] * original[7] - original[6] * original[4];

        this._data[3] = -(original[1] * original[8] - original[7] * original[2]);
        this._data[4] = original[0] * original[8] - original[6] * original[2];
        this._data[5] = -(original[0] * original[7] - original[6] * original[1]);

        this._data[6] = original[1] * original[5] - original[4] * original[2];
        this._data[7] = -(original[0] * original[5] - original[3] * original[2]);
        this._data[8] = original[0] * original[4] - original[3] * original[1];

        //transpose matrix and multiply all elements by inverse of the determinant
        const invDet = 1 / det;
        const original7 = this._data[7];
        let swap;

        this._data[0] *= invDet;
        this._data[4] *= invDet;
        this._data[7] *= invDet;

        swap = this._data[1];
        this._data[1] = this._data[3] * invDet;
        this._data[3] = swap * invDet;

        swap = this._data[2];
        this._data[2] = this._data[6] * invDet;
        this._data[6] = swap * invDet;

        swap = this._data[5];
        this._data[5] = original7 * invDet;
        this._data[7] = swap * invDet;

        return this;
    }

    transpose(): Mat3 {
        let swap;

        swap = this._data[1];
        this._data[1] = this._data[3];
        this._data[3] = swap;

        swap = this._data[2];
        this._data[2] = this._data[6];
        this._data[6] = swap;

        swap = this._data[5];
        this._data[5] = this._data[7];
        this._data[7] = swap;

        return this;
    }

    copy(mat: Mat3): Mat3 {
        this.set(mat._data);
        return this;
    }

    clone(): Mat3 {
        return new Mat3(this._data);
    }
}
