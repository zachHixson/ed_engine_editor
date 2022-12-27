import Tool_Base from './Tool_Base';
import Core from '@/core';

export default class Bucket extends Tool_Base {
    private sampledColor: Core.Draw.Color = new Core.Draw.Color();

    mouseDown(event: MouseEvent): void {
        this.sampledColor = this._sampleColor(this.pixelBuff, this.mouseCell.x, this.mouseCell.y);

        if (Core.Util.isInBounds(this.mouseCell.x, this.mouseCell.y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
            this.fill(this.mouseCell.x, this.mouseCell.y);
            this.commitResult();
        }
    }

    updateCursorBuff(): void {
        this.clearPreviewBuff();

        if (Core.Util.isInBounds(this.mouseCell.x, this.mouseCell.y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
            this.sampledColor = this._sampleColor(this.pixelBuff, this.mouseCell.x, this.mouseCell.y);
            this.fill(this.mouseCell.x, this.mouseCell.y);
        }
    }

    fill(x: number, y: number): void {
        x = Core.Util.clamp(x, 0, this.cellWidth - 1);
        y = Core.Util.clamp(y, 0, this.cellWidth - 1);

        const spriteColor = this._sampleColor(this.pixelBuff, x, y);
        const previewColor = this._sampleColor(this.previewBuff, x, y);

        if (spriteColor.compare(this.sampledColor) && !previewColor.compare(this.color)){
            this.drawPixel(x, y, this.color);

            this.fill(x - 1, y);
            this.fill(x + 1, y);
            this.fill(x, y - 1);
            this.fill(x, y + 1);
        }
    }
}