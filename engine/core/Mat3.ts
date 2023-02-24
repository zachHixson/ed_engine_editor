export class Mat3 {
    private static _buffer = new Array(9);

    private _data = [
        0, 0, 0,
        0, 0, 0,
        0, 1, 1,
    ];

    constructor(data?: Array<number>){
        if (!data) return;

        this.set(data);
    }

    get data(){return this._data}

    set(data: Array<number>): Mat3 {
        if (data.length != 9){
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
        //copy current data to buffer
        Mat3._buffer[0] = this._data[0];
        Mat3._buffer[1] = this._data[1];
        Mat3._buffer[2] = this._data[2];
        Mat3._buffer[3] = this._data[3];
        Mat3._buffer[4] = this._data[4];
        Mat3._buffer[5] = this._data[5];
        Mat3._buffer[6] = this._data[6];
        Mat3._buffer[7] = this._data[7];
        Mat3._buffer[8] = this._data[8];

        //perform multiplication
        this._data[0] = Mat3._buffer[0] * mat._data[0] + Mat3._buffer[1] * mat._data[3] + Mat3._buffer[2] * mat._data[6];
        this._data[1] = Mat3._buffer[0] * mat._data[1] + Mat3._buffer[1] * mat._data[4] + Mat3._buffer[2] * mat._data[7];
        this._data[2] = Mat3._buffer[0] * mat._data[2] + Mat3._buffer[1] * mat._data[5] + Mat3._buffer[2] * mat._data[8];

        this._data[3] = Mat3._buffer[3] * mat._data[0] + Mat3._buffer[4] * mat._data[3] + Mat3._buffer[5] * mat._data[6];
        this._data[4] = Mat3._buffer[3] * mat._data[1] + Mat3._buffer[4] * mat._data[4] + Mat3._buffer[5] * mat._data[7];
        this._data[5] = Mat3._buffer[3] * mat._data[2] + Mat3._buffer[4] * mat._data[5] + Mat3._buffer[5] * mat._data[8];

        this._data[6] = Mat3._buffer[6] * mat._data[0] + Mat3._buffer[7] * mat._data[3] + Mat3._buffer[8] * mat._data[6];
        this._data[7] = Mat3._buffer[6] * mat._data[1] + Mat3._buffer[7] * mat._data[4] + Mat3._buffer[8] * mat._data[7];
        this._data[8] = Mat3._buffer[6] * mat._data[2] + Mat3._buffer[7] * mat._data[5] + Mat3._buffer[8] * mat._data[8];

        return this;
    }

    clone(): Mat3 {
        return new Mat3(this._data);
    }
}