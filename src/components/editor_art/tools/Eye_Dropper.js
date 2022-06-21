import Tool from './Tool';
import store from '@/store';

class Eye_Dropper extends Tool{
    constructor(){
        super();
        this.CURSOR_COLOR = new Shared.Color(255, 255, 255, 170);
    }

    mouseDown(event){
        const {x, y} = this.mouseCell;

        super.mouseDown(event);

        if (Shared.isInBounds(x, y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
            const sampledColor = this._sampleColor(this.pixelBuff, x, y);

            if (sampledColor.a > 0){
                store.dispatch('ArtEditor/selectColor', sampledColor);
            }
        }
    }

    updateCursorBuff(){
        const {x, y} = this.mouseCell;

        this.clearPreviewBuff();

        if (Shared.isInBounds(x, y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
            this.drawPixel(x, y, this.CURSOR_COLOR);
        }
    }
}

export default Eye_Dropper;