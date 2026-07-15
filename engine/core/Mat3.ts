export class Mat3 {
    static readonly MAT3_LENGTH = 9;

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

    set(data: Array<number>): Mat3 {
        if (data.length != Mat3.MAT3_LENGTH){
            console.error('Error: Mat3 requires 9 element array, ' + data.length + ' provided');
        }

        this._data[0] = data[0];
        this._data[1] = data[1];
        this._data[2] = data[2];
        this._data[3] = data[3];
        this._data[4] = data[4];
        this._data[5] = data[5];
        this._data[6] = data[6];
        this._data[7] = data[7];
        this._data[8] = data[8];

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
        const swap0 = this._data[0];
        const swap1 = this._data[1];
        const swap2 = this._data[2];
        const swap3 = this._data[3];
        const swap4 = this._data[4];
        const swap5 = this._data[5];

        this._data[0] = swap4 * this._data[8] - this._data[7] * swap5;
        this._data[1] = -(swap3 * this._data[8] - this._data[6] * swap5);
        this._data[2] = swap3 * this._data[7] - this._data[6] * swap4;

        this._data[3] = -(swap1 * this._data[8] - this._data[7] * swap2);
        this._data[4] = swap0 * this._data[8] - this._data[6] * swap2;
        this._data[5] = -(swap0 * this._data[7] - this._data[6] * swap1);

        this._data[6] = swap1 * swap5 - swap4 * swap2;
        this._data[7] = -(swap0 * swap5 - swap3 * swap2);
        this._data[8] = swap0 * swap4 - swap3 * swap1;

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
