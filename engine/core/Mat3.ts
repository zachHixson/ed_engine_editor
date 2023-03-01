export class Mat3 {
    private static _buffer1 = new Array<number>(9);
    private static _buffer2 = new Array<number>(9);

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
        const buff = this._copyToDest(this._data, Mat3._buffer1);

        this._data[0] = buff[0] * mat._data[0] + buff[1] * mat._data[3] + buff[2] * mat._data[6];
        this._data[1] = buff[0] * mat._data[1] + buff[1] * mat._data[4] + buff[2] * mat._data[7];
        this._data[2] = buff[0] * mat._data[2] + buff[1] * mat._data[5] + buff[2] * mat._data[8];

        this._data[3] = buff[3] * mat._data[0] + buff[4] * mat._data[3] + buff[5] * mat._data[6];
        this._data[4] = buff[3] * mat._data[1] + buff[4] * mat._data[4] + buff[5] * mat._data[7];
        this._data[5] = buff[3] * mat._data[2] + buff[4] * mat._data[5] + buff[5] * mat._data[8];

        this._data[6] = buff[6] * mat._data[0] + buff[7] * mat._data[3] + buff[8] * mat._data[6];
        this._data[7] = buff[6] * mat._data[1] + buff[7] * mat._data[4] + buff[8] * mat._data[7];
        this._data[8] = buff[6] * mat._data[2] + buff[7] * mat._data[5] + buff[8] * mat._data[8];

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
        const swap = this._copyToDest(this._data, Mat3._buffer2);
        const invDet = 1 / det;

        this._data[0] *= invDet;
        this._data[4] *= invDet;
        this._data[7] *= invDet;

        this._data[1] = swap[3] * invDet;
        this._data[3] = swap[1] * invDet;

        this._data[2] = swap[6] * invDet;
        this._data[6] = swap[2] * invDet;

        this._data[5] = swap[7] * invDet;
        this._data[7] = swap[5] * invDet;

        return this;
    }

    transpose(): Mat3 {
        const swap = this._copyToDest(this._data, Mat3._buffer1);

        this._data[1] = swap[3];
        this._data[3] = swap[1];

        this._data[2] = swap[6];
        this._data[6] = swap[2];

        this._data[5] = swap[7];
        this._data[7] = swap[5];

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