import { Vec2 } from "linearz";
import { iInput, iNodeTemplate } from "./iNodeTemplate";
import { iEngineNode, iEditorNode, iEventContext} from "../LogicInterfaces";
import { Instance_Base, Instance_Sprite, Instance_Object, Sprite, Game_Object, Node_Enums, Asset_Base, GenericNode, isEngineNode, Util } from "../core";
import { assetToInstance, instanceToAsset } from './Socket_Conversions';
import { SOCKET_TYPE } from "./Node_Enums";
import { WIDGET_TYPE, WidgetDirection, WidgetEnum } from './Widget';

type SortableAsset = {sortOrder: number};

const catObject: Readonly<iNodeTemplate>[] = [];
const category = 'object';

export default catObject;

{// Remove Instance
    const instInp = {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null} as const satisfies iInput;

    function removeInstance(this: iEngineNode, eventContext: iEventContext): void {
        const instance = this.throwOnNullInput(instInp, eventContext, 'null_instance', false) ?? eventContext.instance;

        if (instance != Node_Enums.THROWN){
            const removeInst = instance ?? eventContext.instance;
            this.engine.removeInstance(removeInst);
        }

        this.triggerOutput('_o', eventContext);
    }

    const removeInstanceNode = {
        id: 'remove_instance',
        category,
        inTriggers: [
            {id: '_i', execute: removeInstance},
        ],
        outTriggers: ['_o'],
        inputs: [
            instInp,
        ],
    } as const satisfies iNodeTemplate;
    catObject.push(removeInstanceNode);
}

{// Object Input
    function getObject(this: iEngineNode): Game_Object | null {
        const objects = this.engine.gameData.objects;
        const selectedEnum = this.widgetData as number;

        return objects.find(o => o.id == selectedEnum) ?? null;
    }

    const objectInput = {
        id:'object_input',
        category,
        widget: {
            type: WIDGET_TYPE.ENUM,
            options: {
                showSearch: true,
                showThumbnail: true,
            },
        },
        outputs: [
            { id: '_o', type: SOCKET_TYPE.ASSET, execute: getObject },
        ],
        onBeforeMount(this: iEditorNode){
            const genericNoOption = {
                name: this.editorAPI.t('generic.no_option'),
                id: -1,
                value: null,
            };
            const objects = this.editorAPI.gameDataStore.getAllObjects.map((o: Game_Object) => ({
                name: o.name,
                id: o.id,
                value: o.id,
                sortOrder: o.sortOrder,
                thumbnail: (()=>{
                    const thumbFrame = o.sprite?.frames[o.startFrame];

                    if (!(thumbFrame && o.sprite)){
                        return Instance_Object.DEFAULT_INSTANCE_ICON[0];
                    }

                    return o.sprite.frameIsEmpty(o.startFrame) ? Instance_Object.DEFAULT_INSTANCE_ICON[0] : o.sprite?.frames[o.startFrame];
                })()
            })).sort((a: SortableAsset, b: SortableAsset)=>a.sortOrder - b.sortOrder);
            const widget = this.widget as WidgetEnum['widget'];

            widget.options.items = [genericNoOption, ...objects];
        },
    } as const satisfies iNodeTemplate;
    catObject.push(objectInput);
}

{// Get Self
    function getSelf(this: iEngineNode, eventContext: iEventContext): Instance_Object {
        return eventContext.instance;
    }

    const getSelfNode = {
        id: 'get_self',
        category,
        outputs: [
            {id: 'self', type: SOCKET_TYPE.INSTANCE, execute: getSelf},
        ],
    };
    catObject.push(getSelfNode);
}

{// Instance Properties
    const instInp = {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null} as const satisfies iInput;

    function getAsset(this: iEngineNode, eventContext: iEventContext): ReturnType<typeof instanceToAsset> {
        const instance = this.throwOnNullInput(instInp, eventContext, 'null_instance', true) ?? eventContext.instance;
        return instanceToAsset(instance, this.engine.gameData);
    }

    function getName(this: iEngineNode, eventContext: iEventContext): string {
        const instance = this.throwOnNullInput(instInp, eventContext, 'null_instance', false) ?? eventContext.instance;

        if (instance == Node_Enums.THROWN){
            return '####';
        }

        return instance.name
    }

    const instanceProperties = {
        id: 'instance_properties',
        category,
        stackDataIO: true,
        inputs: [
            instInp,
        ],
        outputs: [
            {id: 'type', type: SOCKET_TYPE.ASSET, execute: getAsset},
            {id: 'name', type: SOCKET_TYPE.STRING, execute: getName},
        ],
    } as const satisfies iNodeTemplate;
    catObject.push(instanceProperties);
}

{// Spawn Instance
    type NodeData = WeakMap<iEventContext, Instance_Base>;

    const typeInp = {id: 'type', type: SOCKET_TYPE.ASSET, default: null} as const satisfies iInput;
    const xInp = {id: 'x', type: SOCKET_TYPE.NUMBER, default: 0} as const satisfies iInput;
    const yInp = {id: 'y', type: SOCKET_TYPE.NUMBER, default: 0} as const satisfies iInput;
    const relativeInp = {id: 'relative', type: SOCKET_TYPE.BOOL, default: false} as const satisfies iInput;

    function spawnInstance(this: iEngineNode, eventContext: iEventContext): void {
        const baseAsset = this.getInput(typeInp, eventContext);

        if (!baseAsset){
            this.engine.nodeException({
                errorId: Symbol(),
                msgId: 'null_asset',
                logicId: this.parentScript.id,
                nodeId: this.nodeId,
                fatal: true,
            });
            throw new Error('Asset type undefined');
        }

        const x = this.getInput(xInp, eventContext);
        const y = this.getInput(yInp, eventContext);
        const relative = this.getInput(relativeInp, eventContext);
        const pos = relative ? new Vec2(x, y).add(eventContext.instance.pos) : new Vec2(x, y);
        const nextId = this.engine.room.curInstId;
        const newInstance = assetToInstance(baseAsset, nextId, pos);
        let instanceMap = this.getNodeData<NodeData>();

        if (newInstance){
            newInstance.setEngine(this.engine);
            this.engine.addInstance(newInstance);
            newInstance.onCreate();
            instanceMap.set(eventContext, newInstance);
        }
        else{
            this.engine.warn([this.parentScript.name, this.parentScript.graphNames.get(this.graphId) ?? '! No graph ID !'], 'error_creating_asset');
        }

        this.triggerOutput('_o', eventContext);
    }

    function getAsset(this: iEngineNode, eventContext: iEventContext): Instance_Base | null {
        return this.getNodeData<NodeData>().get(eventContext) ?? null;
    }

    const spawnInstanceNode = {
        id: 'spawn_instance',
        category,
        inTriggers: [
            {id: '_i', execute: spawnInstance}
        ],
        outTriggers: ['_o'],
        inputs: [
            typeInp,
            xInp,
            yInp,
            relativeInp,
        ],
        outputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, execute: getAsset},
        ],
        init(this: GenericNode){
            if (!isEngineNode(this)) return;
            this.setNodeData<NodeData>(new WeakMap());
        },
    } as const satisfies iNodeTemplate;
    catObject.push(spawnInstanceNode);
}

{// Get Instances
    const nameInp = {id: 'name', type: SOCKET_TYPE.STRING, default: ''} as const satisfies iInput;
    const groupInp = {id: 'group', type: SOCKET_TYPE.STRING, default: ''} as const satisfies iInput;
    const typeInp = {id: 'type', type: SOCKET_TYPE.ASSET, default: null} as const satisfies iInput;

    function getInstances(this: iEngineNode, eventContext: iEventContext): Instance_Base[] {
        const name = this.getInput(nameInp, eventContext);
        const group = this.getInput(groupInp, eventContext);
        const typeGet = this.throwOnNullInput(typeInp, eventContext, 'null_asset', false);
        const type = typeGet == Node_Enums.THROWN ? null : typeGet;
        const instances: Instance_Base[] = [];
        const intersect = type && group;

        this.engine.room.instances.forEach(instance => {
            if (instance.name == name){
                instances.push(instance);
                return;
            }

            if (intersect){
                if (instance.sourceId == type.id && instance.isInGroup(group)){
                    instances.push(instance);
                }
            }
            else{
                if (instance.sourceId == type?.id || instance.isInGroup(group)){
                    instances.push(instance);
                }
            }
        });

        return instances;
    }

    const getInstancesNode = {
        id: 'get_instances',
        category,
        stackDataIO: true,
        inputs: [
            nameInp,
            groupInp,
            typeInp,
        ],
        outputs: [
            {id: 'instances', type: SOCKET_TYPE.INSTANCE, isList: true, execute: getInstances},
        ],
    } as const satisfies iNodeTemplate;
    catObject.push(getInstancesNode);
}

{// Is In Group
    const groupInp = {id: 'group', type: SOCKET_TYPE.STRING, default: ''} as const satisfies iInput;
    const instInp = {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null} as const satisfies iInput;

    function isInGroup(this: iEngineNode, eventContext: iEventContext): boolean {
        const group = this.getInput(groupInp, eventContext);
        const instance = this.throwOnNullInput(instInp, eventContext, 'null_instance', false) ?? eventContext.instance;

        if (instance == Node_Enums.THROWN){
            return false;
        }

        return !!instance.groups.find(i => i == group);
    }

    const isInGroupNode = {
        id: 'is_in_group',
        category,
        inputs: [
            groupInp,
            instInp,
        ],
        outputs: [
            {id: '_o', type: SOCKET_TYPE.BOOL, execute: isInGroup},
        ],
    } as const satisfies iNodeTemplate;
    catObject.push(isInGroupNode);
}

{// Raycast
    const startXInp = {id: 'start_x', type: SOCKET_TYPE.NUMBER, optional: true, default: null} as const satisfies iInput;
    const startYInp = {id: 'start_y', type: SOCKET_TYPE.NUMBER, optional: true, default: null} as const satisfies iInput;
    const distanceInp = {id: 'distance', type: SOCKET_TYPE.NUMBER, default: 1} as const satisfies iInput;
    const onlySolidInp = {id: 'only_solid', type: SOCKET_TYPE.BOOL, default: false} as const satisfies iInput;

    function raycast(this: iEngineNode, eventContext: iEventContext): Instance_Base[] {
        const widgetDir = this.widgetData as WidgetDirection['widget']['data'];
        const startX = this.getOptionalInput(startXInp, eventContext);
        const startY = this.getOptionalInput(startYInp, eventContext);
        const distance = this.getInput(distanceInp, eventContext);
        const onlySolid = this.getInput(onlySolidInp, eventContext);
        const startPos = new Vec2(
            startX ?? eventContext.instance.pos.x,
            startY ?? eventContext.instance.pos.y,
        );
        const ignoreSelf = (startX || true) || (startY || true);
        const rayVector = new Vec2(widgetDir[0], widgetDir[1]).multiplyScalar(distance);
        const nearInstances = this.engine.room.getInstancesInRadius(startPos, distance)
            .filter(i => {
                const selfCheck = !ignoreSelf || i.id != eventContext.instance.id;
                const solidCheck = !onlySolid || i.isSolid;
                return selfCheck && solidCheck;
            });
        const halfSpriteDim = Sprite.DIMENSIONS / 2;
        const spriteDim = new Vec2(halfSpriteDim, halfSpriteDim);
        const collisions: Instance_Base[] = [];

        for (let i = 0; i < nearInstances.length; i++){
            const curInstance = nearInstances[i];
            const curInstancePos = curInstance.pos.clone()
            const intersect = Util.projectSVF(startPos, rayVector, curInstancePos, spriteDim);

            intersect && collisions.push(curInstance);
        }

        collisions.sort((a, b)=>{
            const aDist = a.pos.distanceNoSqrt(startPos);
            const bDist = b.pos.distanceNoSqrt(startPos);

            return aDist - bDist;
        });

        return collisions;
    }

    const raycastNode = {
        id: 'raycast',
        category,
        stackDataIO: true,
        widget: {
            type: WIDGET_TYPE.DIRECTION,
            options: {
                startDir: [1, 0],
            },
        },
        inputs: [
            startXInp,
            startYInp,
            distanceInp,
            onlySolidInp,
        ],
        outputs: [
            {id: 'instances', type: SOCKET_TYPE.INSTANCE, isList: true, execute: raycast},
        ],
    } as const satisfies iNodeTemplate;
    catObject.push(raycastNode);
}

{// Set Animation Playback
    const instInp = {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null} as const satisfies iInput;
    const frameInp = {id: 'frame', type: SOCKET_TYPE.NUMBER, optional: true, default: null} as const satisfies iInput;
    const fpsInp = {id: 'fps', type: SOCKET_TYPE.NUMBER, optional: true, default: null} as const satisfies iInput;
    const loopInp = {id: 'loop', type: SOCKET_TYPE.TRIPLE, default: null} as const satisfies iInput;
    const isPlayingInp = {id: 'is_playing', type: SOCKET_TYPE.TRIPLE, default: null} as const satisfies iInput;

    function setSettings(this: iEngineNode, eventContext: iEventContext): void {
        const instance = this.throwOnNullInput(instInp, eventContext, 'null_instance', false) ?? eventContext.instance;
        const frame = this.getOptionalInput(frameInp, eventContext);
        const fps = this.getOptionalInput(fpsInp, eventContext);
        const loop = this.getInput(loopInp, eventContext);
        const playing = this.getInput(isPlayingInp, eventContext);

        if (!instance || instance == Node_Enums.THROWN){
            this.triggerOutput('_o', eventContext);
            return;
        }

        const mutInstance = <Instance_Base>instance;

        if (frame != null){
            mutInstance.animFrame = frame;
        }

        if (fps != null){
            mutInstance.fpsOverride = fps;
        }

        if (loop != null){
            mutInstance.animLoopOverride = loop;
        }

        if (playing != null){
            mutInstance.animPlaying = playing;
        }

        mutInstance.needsRenderUpdate = true;

        this.triggerOutput('_o', eventContext);
    }

    const setAnimationPlayback = {
        id: 'set_animation_playback',
        category,
        inTriggers: [
            {id: '_i', execute: setSettings},
        ],
        outTriggers: ['_o'],
        inputs: [
            instInp,
            frameInp,
            fpsInp,
            loopInp,
            isPlayingInp,
        ],
    } as const satisfies iNodeTemplate;
    catObject.push(setAnimationPlayback);
}

{// Set Sprite
    const instInp = {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null} as const satisfies iInput;

    function setSprite(this: iEngineNode, eventContext: iEventContext): void {
        const instance = this.throwOnNullInput(instInp, eventContext, 'null_instance', false) ?? eventContext.instance;
        const widgetData = this.widgetData;
        const spriteId: number = widgetData as number;
        const sprite = this.engine.gameData.sprites.find(s => s.id == spriteId);

        if (instance != Node_Enums.THROWN){
            instance.sprite = sprite ?? null;
            this.engine.refreshRenderedInstance(instance);
        }

        this.triggerOutput('_o', eventContext);
    }

    const setSpriteNode = {
        id: 'set_sprite',
        category,
        widget: {
            type: WIDGET_TYPE.ENUM,
            options: {
                items: [],
                showSearch: true,
                showThumbnail: true,
            },
        },
        inTriggers: [
            {id: '_i', execute: setSprite},
        ],
        outTriggers: ['_o'],
        inputs: [
            instInp,
        ],
        onBeforeMount(this: iEditorNode){
            const genericNoOption = {
                name: this.editorAPI.t('generic.no_option'),
                id: -1,
                value: null,
            };
            const sprites = this.editorAPI.gameDataStore.getAllSprites.map((s: Sprite)=>({
                name: s.name,
                id: s.id,
                value: s.id,
                sortOrder: s.sortOrder,
                thumbnail: (()=>{
                    if (s.frameIsEmpty(0)){
                        return Instance_Sprite.DEFAULT_SPRITE_ICON[0];
                    }

                    return s.frames[0];
                })(),
            })).sort((a: SortableAsset, b: SortableAsset)=>a.sortOrder - b.sortOrder);
            const widget = this.widget as WidgetEnum['widget'];

            widget.options.items = [genericNoOption, ...sprites];
        },
    } as const satisfies iNodeTemplate;
    catObject.push(setSpriteNode);
}

{// Flip Sprite
    const instInp = {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null} as const satisfies iInput;
    const hFlipInp = {id: 'hFlip', type: SOCKET_TYPE.BOOL, default: false} as const satisfies iInput;
    const vFlipInp = {id: 'vFlip', type: SOCKET_TYPE.BOOL, default: false} as const satisfies iInput;

    function flipSprite(this: iEngineNode, eventContext: iEventContext): void {
        const instance = this.throwOnNullInput(instInp, eventContext, 'null_instance', false) ?? eventContext.instance;
        const hFlip = this.getInput(hFlipInp, eventContext) as boolean;
        const vFlip = this.getInput(vFlipInp, eventContext) as boolean;

        if (instance != Node_Enums.THROWN){
            instance.flipH = hFlip;
            instance.flipV = vFlip;
            instance.needsRenderUpdate = true;
        }

        this.triggerOutput('_o', eventContext);
    }

    const flipSpriteNode = {
        id: 'flip_sprite',
        category,
        inTriggers: [
            {id: '_i', execute: flipSprite},
        ],
        outTriggers: ['_o'],
        inputs: [
            instInp,
            hFlipInp,
            vFlipInp,
        ],
    };
    catObject.push(flipSpriteNode);
}
