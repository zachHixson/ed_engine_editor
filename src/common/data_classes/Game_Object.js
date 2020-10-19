import Asset from './Asset';
import {CATEGORY_ID, CATEGORY_TYPE} from '../Enums';

class Game_Object extends Asset{
    constructor(){
        super();
        this.sprite = null;
        this.startFrame = 0;
        this.fps = 6;
        this.animLoop = true;
        this.isSolid = false;
        this.applyGravity = false;
        this.useRoomGravity = true;
        this.customGravity = [0,0];
        this.customLogic = false;
        this.logicPreset = null;
    }

    get type(){return CATEGORY_TYPE.OBJECT}
    get category_ID(){return CATEGORY_ID.OBJECT}
}

export default Game_Object;