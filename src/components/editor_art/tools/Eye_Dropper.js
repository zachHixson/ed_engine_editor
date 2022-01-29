import Tool from './Tool';
import {isInBounds, get2DIdx} from '@shared/Util_2D';
import store from '@/store';

class Eye_Dropper extends Tool{
    constructor(){
        super();
    }

    mouseDown(event){
        super.mouseDown(event);

        if (isInBounds(this.mouseCell.x, this.mouseCell.y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
            let sampledColor = this.pixelBuff[get2DIdx(this.mouseCell.x, this.mouseCell.y, this.cellWidth)];

            if (sampledColor.length > 0){
                store.dispatch('ArtEditor/selectColor', sampledColor);
            }
        }
    }

    updateCursorBuff(){
        const CURSOR_COLOR = '#FFFFFFAA';

        this.clearPreviewBuff();

        if (isInBounds(this.mouseCell.x, this.mouseCell.y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
            this.previewBuff[get2DIdx(this.mouseCell.x, this.mouseCell.y, this.cellWidth)] = CURSOR_COLOR;
        }
    }
}

export default Eye_Dropper;