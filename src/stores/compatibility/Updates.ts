export type VersionNum = [number, number, number];

export type Update<OldDataType> = {
    version: VersionNum;
    updateCallback: (data: OldDataType) => void;
};

export class Updates {
    private static _updateVersions: Array<Update<unknown>> = [];

    static add<OldDataType>(update: Update<OldDataType>): void {
        this._updateVersions.push(update as unknown as Update<unknown>);
    }

    static get length(): number {return Updates._updateVersions.length};

    static get(idx: number): Update<unknown> {
        return Updates._updateVersions[idx];
    }
}
