import Core from '@/core';
import svgToCanvas from '@/components/common/svgToCanvas';

import cameraLocIconRaw from '@/assets/camera_location.svg?raw';
import objectIconRaw from '@/assets/object_icon.svg?raw';
import exitIconRaw from '@/assets/exit.svg?raw';
import endIconRaw from '@/assets/end.svg?raw';

const { Vector, Draw, WGL } = Core;

const NO_SPRITE_PADDING = 0.85;
let iconsLoaded = false;

export default class Room_Edit_Renderer extends Core.Instance_Renderer {
    constructor(canvas: HTMLCanvasElement, navState: Core.NavState){
        super(canvas, navState);
    }

    get CELL_PX_WIDTH(){return 50};
    get UNIT_WIDTH(){return this.CELL_PX_WIDTH / 16};

    getMouseCell(){
        return //this.mouseCell;
    }

    getMouseWorldCell(){
        return //this.mouseCell.clone().multiplyScalar(16);
    }

    setRoomRef(roomObj: Core.Room){
        //
    }

    setSelection(instRef: Core.Instance_Base){
        //
    }

    setGridVisibility(newVisibility: boolean){
        //
    }

    mouseMove(event: MouseEvent){
        //
    }

    navChanged(): void {
        this._viewMatrixNeedsUpdate = true;
        this.render();
    }

    instancesChanged(){
        //
    }

    bgColorChanged(){
        //
    }

    resize(){
        super.resize();
        this.render();
    }

    fullRedraw(){
        //
    }

    _composite(){
        //
    }

    _drawObjects(){
        //
    }

    screenToWorldPos(pt: Core.Vector){
        //
    }

    worldToScreenPos(pt: Core.Vector){
        //
    }
}