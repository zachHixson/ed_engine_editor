import { ArtMainEventBus } from "../ArtMain.vue";
import Tool_Base from "./Tool_Base";
import Core from '@/core';

export default class Move extends Tool_Base {
    private CURSOR_COLOR = new Core.Draw.Color(255, 255, 255, 170);
    private _mouseDownPos: Core.Vector = new Core.Vector();
    private _moveBuffer: ImageData = new ImageData(Core.Sprite.DIMENSIONS, Core.Sprite.DIMENSIONS);

    constructor(){
        super();
    }

    private _clipBounds(arr: number[], offset: Core.ConstVector): void {
        const min = offset.clone()
        const max = min.clone().addScalar(Core.Sprite.DIMENSIONS);

        for (let i = 0; i < arr.length; i += 4){
            const col = (i / 4) % (Core.Sprite.DIMENSIONS);
            const row = Math.floor((i / 4) / Core.Sprite.DIMENSIONS);
            const lowerBound = col >= min.x && row >= min.y;
            const upperBound = col < max.x && row < max.y; 
            
            if (!(lowerBound && upperBound)){
                arr[i + 0] = 0;
                arr[i + 1] = 0;
                arr[i + 2] = 0;
                arr[i + 3] = 0;
            }
        }
    }

    mouseDown(event: MouseEvent): void {
        super.mouseDown(event);
        this._mouseDownPos.copy(this.mouseCell);
        this._moveBuffer.data.set(this.pixelBuff.data);
        this.pixelBuff.data.fill(0);
        ArtMainEventBus.emit('update-frame-previews');
        this.updateCursorBuff();
    }

    mouseUp(event: MouseEvent): void {
        super.mouseUp(event);
        this.commitResult();
        this.updateCursorBuff();
    }
    
    updateCursorBuff(): void {
        const {x, y} = this.mouseCell;

        this.clearPreviewBuff();

        if (!this._mouseDown){
            if (!Core.Util.isInBounds(x, y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)) return;

            this.drawPixel(x, y, this.CURSOR_COLOR);
            return;
        }

        const delta = this.mouseCell.clone().subtract(this._mouseDownPos);
        let pixelArr = [...this._moveBuffer.data];

        if (delta.x > 0){
            pixelArr.unshift(...pixelArr.splice(-delta.x * 4));
        }
        else {
            pixelArr = pixelArr.concat(pixelArr.splice(0, -delta.x * 4));
        }

        if (delta.y > 0){
            pixelArr.unshift(...pixelArr.splice(-delta.y * 4 * Core.Sprite.DIMENSIONS));
        }
        else{
            pixelArr = pixelArr.concat(pixelArr.splice(0, -delta.y * 4 * Core.Sprite.DIMENSIONS));
        }

        this._clipBounds(pixelArr, delta);

        this.previewBuff.data.set(pixelArr);
    }
}