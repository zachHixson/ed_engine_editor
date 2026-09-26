export type VersionNum = [number, number, number];

export type Update = {
    version: VersionNum;
    updateCallback: (data: any) => void;
};

export class Updates {
    private static _updateVersions: Array<Update> = [];

    static add(update: Update): void {
        this._updateVersions.push(update);
    }

    static get length(): number {return Updates._updateVersions.length};

    static get(idx: number): Update {
        return Updates._updateVersions[idx];
    }
}
