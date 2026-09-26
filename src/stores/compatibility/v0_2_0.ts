import { Updates } from "./Updates";
import type {
    tNavSaveData,
    tSerializedGameData,
    AssetSave,
    SpriteSave,
    GameObjectSave,
    RoomSave,
    LogicSave,
    CameraSave,
    InstanceBaseSave,
    GraphSave,
    NodeSave,
    ConnectionSave,
    InstanceSpriteSave,
    InstanceObjectSave,
    InstanceLogicSave,
    ExitSave,
} from "@engine/core/core";
import { INSTANCE_TYPE } from "@engine/core/core";
import { vec2ToU32 } from "@engine/core/Util";
import Core from "@/core";

type AssetSaveOld = {
    id: number;
    name: string;
    sort: number;
};

type SpriteSaveOld = AssetSaveOld & {
    frmLst: Array<string>,
    navDat: tNavSaveData,
};

type GameObjectSaveOld = AssetSaveOld & {
	strtFrm: number,
	sprID: number | '',
	animFPS: number,
	loopAnim: 1 | 0,
	playAnim: 1 | 0,
	zDepth: number,
	isSolid: 1 | 0,
	useGrav: 1 | 0,
	tgrExit: 1 | 0,
	exitBeh: string,
	keepCamSet: 1 | 0,
	custLog: 1 | 0,
	logScrID: number | '',
	grpList: Array<string>,
};

type vec = [x: number, y: number];

type CameraSaveOld = {
    _size: number,
   	pos: vec,
	vel: vec,
	moveType: string,
	scrDir: string,
	scrSpeed: number,
	flwObjId: number | '',
	flwType: string,
};

type InstanceBaseSaveOld = {
   	id: number,
	name: string,
	instType: string,
	pos: vec,
	zDepOvr: number | '',
	groups: Array<string>,
	strtFrmOvr: number | '',
	fpsOvr: number | '',
	animLoopOvr: 0 | 1 | 2,
	animPlayingOvr: 0 | 1 | 2,
};

type InstanceSpriteSaveOld = InstanceBaseSaveOld & {
    sprID: number,
};

type InstanceObjectSaveOld = InstanceBaseSaveOld & {
    srcObjID: number,
    zDepOvr: number | '',
    colOvr: string,
};

type InstanceLogicSaveOld = InstanceObjectSaveOld & {
    logId: number,
};

type InstanceExitSaveOld = InstanceBaseSaveOld & {
    detBktrk: 1 | 0,
    isEnd: 1 | 0,
    dstRmID: number | '',
    dstRmExit: number | '',
    trnsType: string,
    endDlg: string,
};

type RoomSaveOld = AssetSaveOld & {
    camDat: CameraSaveOld,
    instList: Array<InstanceBaseSaveOld>,
    bgCol: string,
    persist: 1 | 0,
    gravOn: 1 | 0,
    gravStr: number,
    navDat: tNavSaveData,
};

type GraphSaveOld = {
    ID: number,
    name: string,
    navDat: tNavSaveData,
};

type NodeSaveOld = {
    tmplID: string,
    nodeID: number,
    graphID: number,
    pos: vec,
    inps: Array<[string, any]>,
    wdgDat: any,
    ext: any,
};

type ConnectionSaveOld = {
	ID: number,
	graphID: number,
	sSocID: string,
	eSocID: string,
	sNodeID: number,
	eNodeID: number,
};

type LogicSaveOld = AssetSaveOld & {
    selGraphID: number,
    graphLst: Array<GraphSaveOld>,
    nodeDatLst: Array<NodeSaveOld>,
    cncDatLst: Array<ConnectionSaveOld>,
};

type ProjectSaveOld = {
    sprites: Array<SpriteSaveOld>,
    objects: Array<GameObjectSaveOld>,
    rooms: Array<RoomSaveOld>,
    logic: Array<LogicSaveOld>,
};

function getBaseAssetData(data: AssetSaveOld): AssetSave {
    return [data.id, data.name, data.sort];
}

function spriteToArray(data: SpriteSaveOld): SpriteSave {
    return [
        ...getBaseAssetData(data),
        data.frmLst,
        data.navDat,
    ];
}

function objectToArray(data: GameObjectSaveOld): GameObjectSave {
    return [
        ...getBaseAssetData(data),
        data.strtFrm,
        data.sprID,
        data.animFPS,
        data.loopAnim,
        data.playAnim,
        data.zDepth,
        data.isSolid,
        data.useGrav,
        data.tgrExit,
        data.exitBeh,
        data.keepCamSet,
        data.custLog,
        data.logScrID,
        data.grpList,
    ];
}

function cameraToArray(data: CameraSaveOld): CameraSave {
    return [
        data._size,
        data.pos,
        data.vel,
        data.moveType,
        data.scrDir,
        data.scrSpeed,
        data.flwObjId,
        data.flwType,
    ];
}

function instBaseToArray(data: InstanceBaseSaveOld): InstanceBaseSave {
    const pos = {x: data.pos[0], y: data.pos[1]};
    return [
        data.id,
        data.name,
        data.instType,
        vec2ToU32(pos),
        data.zDepOvr,
        data.groups,
        data.strtFrmOvr,
        data.fpsOvr,
        data.animLoopOvr,
        data.animPlayingOvr,
    ];
}

function instSpriteToArray(data: InstanceSpriteSaveOld): InstanceSpriteSave {
    return [
        ...instBaseToArray(data),
        data.sprID,
    ];
}

function instObjectToArray(data: InstanceObjectSaveOld): InstanceObjectSave {
    return [
        ...instBaseToArray(data),
        data.srcObjID,
        data.zDepOvr,
        data.colOvr,
    ];
}

function instLogicToArray(data: InstanceLogicSaveOld): InstanceLogicSave {
    return [
        ...instObjectToArray(data),
        data.logId
    ];
}

function instExitToArray(data: InstanceExitSaveOld): ExitSave {
    return [
        ...instBaseToArray(data),
        data.detBktrk,
        data.isEnd,
        data.dstRmID,
        data.dstRmExit,
        data.trnsType,
        data.endDlg,
    ];
}

function instanceToArray(data: InstanceBaseSaveOld): InstanceBaseSave {
    const instType = data.instType;
    const d = data as any;

    switch(instType) {
        case INSTANCE_TYPE.SPRITE:
            return instSpriteToArray(d) as unknown as InstanceBaseSave;
        case INSTANCE_TYPE.OBJECT:
            return instObjectToArray(d) as unknown as InstanceBaseSave;
        case INSTANCE_TYPE.LOGIC:
            return instLogicToArray(d) as unknown as InstanceBaseSave;
        case INSTANCE_TYPE.EXIT:
            return instExitToArray(d) as unknown as InstanceBaseSave;
    }

    throw new Error("Could not update data of unknown instance type");
}

function roomToArray(data: RoomSaveOld): RoomSave {
    return [
        ...getBaseAssetData(data),
        cameraToArray(data.camDat),
        data.instList.map(i => instanceToArray(i)),
        data.bgCol,
        data.persist,
        data.gravOn,
        data.gravStr,
        data.navDat,
    ];
}

function graphToArray(data: GraphSaveOld): GraphSave {
    return [
        data.ID,
        data.name,
        data.navDat,
    ];
}

function nodeToArray(data: NodeSaveOld): NodeSave {
    return [
        data.tmplID,
        data.nodeID,
        data.graphID,
        data.pos,
        data.inps,
        data.wdgDat,
        data.ext,
    ];
}

function connectionToArray(data: ConnectionSaveOld): ConnectionSave {
    return [
        data.ID,
        data.graphID,
        data.sSocID,
        data.eSocID,
        data.sNodeID,
        data.eNodeID,
    ];
}

function logicToArray(data: LogicSaveOld): LogicSave {
    return [
        ...getBaseAssetData(data),
        data.selGraphID,
        data.graphLst.map(i => graphToArray(i)),
        data.nodeDatLst.map(i => nodeToArray(i)),
        data.cncDatLst.map(i => connectionToArray(i)),
    ];
}

function dataClassesToArrays(data: ProjectSaveOld): void {
    const fixedData = data as unknown as tSerializedGameData;
    fixedData.sprites = data.sprites.map(i => spriteToArray(i));
    fixedData.objects = data.objects.map(i => objectToArray(i));
    fixedData.rooms = data.rooms.map(i => roomToArray(i));
    fixedData.logic = data.logic.map(i => logicToArray(i));
}

function decompressFrame(frame: string[]): ImageData {
    const PIXEL_COUNT = 256;
    const XPRNT = {r: 0, g: 0, b: 0, a: 0};
    const data = new Uint8ClampedArray(PIXEL_COUNT * 4);
    let dataIdx = 0;

    // Each element in the array represents either a hex value (RGB), an empty space (xprnt), or a number representing how many times to duplicate the previous hex value
    for (let i = 0; i < frame.length; i++) {
        const val = frame[i];
        const range = parseInt(val);
        const isVal = val.length == 6 || val.length == 0;

        if (isVal) {
            //is hex value or xprnt
            const {r, g, b, a} = val.length > 0 ? Core.Draw.hexToRGBA(val) : XPRNT;
            data.set([r, g, b, a], dataIdx);
            dataIdx += 4;
        }
        else {
            //is marker value
            const prevColor = [
                data[dataIdx - 4],
                data[dataIdx - 3],
                data[dataIdx - 2],
                data[dataIdx - 1],
            ];

            for (let j = 0; j < range; j++) {
                data.set(prevColor, dataIdx);
                dataIdx += 4;
            }
        }
    }

    return new ImageData(data, 16, 16);
}

function updateSprites(data: tSerializedGameData): void {
    const spriteData = data.sprites;

    for (let i = 0; i < spriteData.length; i++) {
        const frames = spriteData[i][3];
        const imgDataFrames = new Array<ImageData>(frames.length);

        for (let j = 0; j < frames.length; j++) {
            const frame = frames[j].split(',');
            imgDataFrames[j] = decompressFrame(frame);
        }

        spriteData[i][3] = Core.Sprite.compressFrames(imgDataFrames);
    }
}

Updates.add({
    version: [0, 2, 0],
    updateCallback: data => {
        dataClassesToArrays(data);
        updateSprites(data);
    }
});
