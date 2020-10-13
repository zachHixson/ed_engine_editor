import Tool from './Tool';
import Util_2D from '@/common/Util_2D';
import store from '@/store';

class Eye_Dropper extends Tool{
    constructor(){
        super();
    }

    mouseDown(event){
        super.mouseDown(event);

        if (Util_2D.isInBounds(this.mouseCell.x, this.mouseCell.y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
            let sampledColor = this.pixelBuff[Util_2D.get2DIdx(this.mouseCell.x, this.mouseCell.y, this.cellWidth)];

            if (sampledColor.length > 0){
                store.dispatch('ArtEditor/selectColor', sampledColor);
            }
        }
    }

    updateCursorBuff(){
        const CURSOR_COLOR = '#FFFFFFAA';

        this.clearPreviewBuff();

        if (Util_2D.isInBounds(this.mouseCell.x, this.mouseCell.y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
            this.previewBuff[Util_2D.get2DIdx(this.mouseCell.x, this.mouseCell.y, this.cellWidth)] = CURSOR_COLOR;
        }
    }
}

export default Eye_Dropper;