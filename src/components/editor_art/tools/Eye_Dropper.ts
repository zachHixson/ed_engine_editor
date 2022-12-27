import Tool_Base from './Tool_Base';
import Core from '@/core';
import { useArtEditorStore } from '@/stores/ArtEditor';

export default class Eye_Dropper extends Tool_Base {
    private CURSOR_COLOR = new Core.Draw.Color(255, 255, 255, 170);

    mouseDown(event: MouseEvent): void {
        const {x, y} = this.mouseCell;

        super.mouseDown(event);

        if (Core.Util.isInBounds(x, y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
            const sampledColor = this._sampleColor(this.pixelBuff, x, y);

            if (sampledColor.a > 0){
                const artEditorStore = useArtEditorStore();
                artEditorStore.selectColor(sampledColor);
            }
        }
    }

    updateCursorBuff(): void {
        const {x, y} = this.mouseCell;

        this.clearPreviewBuff();

        if (Core.Util.isInBounds(x, y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
            this.drawPixel(x, y, this.CURSOR_COLOR);
        }
    }
}