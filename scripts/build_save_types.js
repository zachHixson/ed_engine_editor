const fs = require('fs');
const outputPath = './_compiled/';

const number = 'number';
const string = 'string';
const ibool = '1 | 0';
const any = 'any';
const vec = 'vec';
const numOrEmpty = `number | ''`;
let output = '';

function addStruct(name, struct) {
    const structKeys = Object.keys(struct);

    //add obj type
    output += `export type ${name} = [\n`;

    structKeys.forEach(i => output += `\t${i}: ${struct[i]},\n`);

    output += ']\n';

    //add enum IDs
    output += `export const enum ${name}Id {\n`;

    structKeys.forEach(i => output += `\t${i},\n`);

    output += '}\n';
    output += '\n';
}

function Array(dataType) {
    return `Array<${dataType}>`;
}

output += `type vec = [number, number];\n`;
output += `export type tNavSaveData = [number, number, number];\n`;
output += '\n';

addStruct('CameraSave', {
    _size: number,
    pos: vec,
    vel: vec,
    moveType: string,
    scrollDir: string,
    scrollSpeed: number,
    followObjId: numOrEmpty,
    followType: string,
});

const assetBase = {
    id: number,
    name: string,
    sortOrder: number,
};

addStruct('AssetSave', assetBase);

addStruct('GameObjectSave', {
    ...assetBase,
    startFrame: number,
    spriteID: numOrEmpty,
    animFPS: number,
    loopAnim: ibool,
    playAnim: ibool,
    zDepth: number,
    isSolid: ibool,
    useGravity: ibool,
    triggerExits: ibool,
    exitBehavior: string,
    keepCameraSettings: ibool,
    customLogic: ibool,
    logicScriptID: numOrEmpty,
    groupList: Array(string),
});

const instanceBase = {
    id: number,
    name: string,
    instanceType: string,
    pos: vec,
    zDepthOverride: numOrEmpty,
    groups: Array(string),
    startFrameOverride: numOrEmpty,
    fpsOverride: numOrEmpty,
    animLoopOverride: `0 | 1 | 2`,
    animPlayingOverride: `0 | 1 | 2`,
}

addStruct('InstanceBaseSave', instanceBase);

addStruct('ExitSave', {
    ...instanceBase,
    detectBacktrack: ibool,
    isEnding: ibool,
    destRoomID: numOrEmpty,
    destRoomExit: numOrEmpty,
    transiType: string,
    endingDialog: string,
});

const instanceObjectBase = {
    ...instanceBase,
    srcObjID: number,
    zDepthOver: numOrEmpty,
    collOver: string,
};

addStruct('InstanceObjectSave', instanceObjectBase);

addStruct('InstanceLogicSave', {
    ...instanceObjectBase,
    logicId: number,
});

addStruct('InstanceSpriteSave', {
    ...instanceBase,
    spriteID: number,
});

addStruct('RoomSave', {
    ...assetBase,
    cameraData: 'CameraSave',
    instanceList: Array('InstanceBaseSave'),
    bgCol: string,
    persist: ibool,
    gravOn: ibool,
    gravStrength: number,
    navData: 'tNavSaveData',
});

addStruct('SpriteSave', {
    ...assetBase,
    frameList: Array(string),
    navSaveData: 'tNavSaveData',
});

const nodeSave = {
    templateID: string,
    nodeID: number,
    graphID: number,
    pos: vec,
    inputs: Array('[string, any]'),
    widgetData: any,
    extra: any,
}

addStruct('NodeSave', nodeSave);

const connectionSave = {
    ID: number,
    graphID: number,
    startSocketID: string,
    endSocketID: string,
    startNodeID: number,
    endNodeID: number,
};

addStruct('ConnectionSave', connectionSave);

addStruct('LogicSave', {
    ...assetBase,
    selectedGraphID: number,
    graphList: Array('[id: number, name: string, nav: tNavSaveData]'),
    nodeDataList: Array('NodeSave'),
    connectionDataList: Array('ConnectionSave'),
});

addStruct('GraphSave', {
    ID: number,
    name: string,
    navSaveData: 'tNavSaveData',
});

if (!fs.existsSync(outputPath)){
    fs.mkdirSync(outputPath);
}

fs.writeFileSync(outputPath + 'SaveTypes.ts', output);