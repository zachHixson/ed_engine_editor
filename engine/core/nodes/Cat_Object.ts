import { iNodeTemplate } from "./iNodeTemplate";
import { iEngineNode, iEditorNode, iEventContext} from "../LogicInterfaces";
import { Instance_Base, Instance_Sprite, Instance_Object, Sprite, Game_Object, Node_Enums, Asset_Base, GenericNode, isEngineNode, Util } from "../core";
import { assetToInstance, instanceToAsset } from './Socket_Conversions';
import { SOCKET_TYPE, WIDGET } from "./Node_Enums";
import { Vector } from '../Vector';

type SortableAsset = {sortOrder: number};

const catObject: iNodeTemplate[] = [];
export default catObject;

{// Remove Instance
    function removeInstance(this: iEngineNode, eventContext: iEventContext): void {
        const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', false) ?? eventContext.instance;

        if (instance != Node_Enums.THROWN){
            const removeInst = instance ?? eventContext.instance;
            this.engine.removeInstance(removeInst);
        }

        this.triggerOutput('_o', eventContext);
    }

    const removeInstanceNode = {
        id: 'remove_instance',
        category: 'object',
        inTriggers: [
            {id: '_i', execute: removeInstance},
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null, required: true},
        ],
    };
    catObject.push(removeInstanceNode);
}

{// Object Input
    function getObject(this: iEngineNode): Game_Object | null {
        const objects = this.engine.gameData.objects;
        const selectedObjectId = this.widgetData;

        return objects.find(o => o.id == selectedObjectId) ?? null;
    }

    const objectInput = {
        id:'object_input',
        category: 'object',
        widget: {
            id: 'object',
            type: WIDGET.ENUM,
            options: {
                items: [],
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

            this.widget.options.items = [genericNoOption, ...objects];
        },
    };
    catObject.push(objectInput);
}

{// Get Self
    function getSelf(this: iEngineNode, eventContext: iEventContext): Instance_Object {
        return eventContext.instance;
    }

    const getSelfNode = {
        id: 'get_self',
        category: 'object',
        outputs: [
            {id: 'self', type: SOCKET_TYPE.INSTANCE, execute: getSelf},
        ],
    };
    catObject.push(getSelfNode);
}

{// Instance Properties
    function getAsset(this: iEngineNode, eventContext: iEventContext): ReturnType<typeof instanceToAsset> {
        const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', true) ?? eventContext.instance;
        return instanceToAsset(instance, this.engine.gameData);
    }

    function getName(this: iEngineNode, eventContext: iEventContext): string {
        const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', false) ?? eventContext.instance;

        if (instance == Node_Enums.THROWN){
            return '####';
        }

        return instance.name
    }

    const instanceProperties = {
        id: 'instance_properties',
        category: 'object',
        stackDataIO: true,
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null, required: true},
        ],
        outputs: [
            {id: 'type', type: SOCKET_TYPE.ASSET, execute: getAsset},
            {id: 'name', type: SOCKET_TYPE.STRING, execute: getName},
        ],
    };
    catObject.push(instanceProperties);
}

{// Spawn Instance
    type NodeData = WeakMap<iEventContext, Instance_Base>;

    function spawnInstance(this: iEngineNode, eventContext: iEventContext): void {
        const baseAsset = this.getInput<Asset_Base>('type', eventContext);

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

        const x = this.getInput<number>('x', eventContext);
        const y = this.getInput<number>('y', eventContext);
        const relative = this.getInput<boolean>('relative', eventContext);
        const pos = relative ? new Vector(x, y).add(eventContext.instance.pos) : new Vector(x, y);
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
        category: 'object',
        inTriggers: [
            {id: '_i', execute: spawnInstance}
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'type', type: SOCKET_TYPE.ASSET, default: null, required: true},
            {id: 'x', type: SOCKET_TYPE.NUMBER, default: 0, required: true},
            {id: 'y', type: SOCKET_TYPE.NUMBER, default: 0, required: true},
            {id: 'relative', type: SOCKET_TYPE.BOOL, default: false},
        ],
        outputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, execute: getAsset},
        ],
        init(this: GenericNode){
            if (!isEngineNode(this)) return;
            this.setNodeData<NodeData>(new WeakMap());
        },
    };
    catObject.push(spawnInstanceNode);
}

{// Get Instances
    function getInstances(this: iEngineNode, eventContext: iEventContext): Instance_Base[] {
        const name = this.getInput<string>('name', eventContext);
        const group = this.getInput<string>('group', eventContext);
        const typeGet = this.throwOnNullInput<Asset_Base | null>('type', eventContext, 'null_asset', false);
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
        category: 'object',
        stackDataIO: true,
        inputs: [
            {id: 'name', type: SOCKET_TYPE.STRING, default: ''},
            {id: 'group', type: SOCKET_TYPE.STRING, default: ''},
            {id: 'type', type: SOCKET_TYPE.ASSET, default: null},
        ],
        outputs: [
            {id: 'instances', type: SOCKET_TYPE.INSTANCE, isList: true, execute: getInstances},
        ],
    };
    catObject.push(getInstancesNode);
}

{// Is In Group
    function isInGroup(this: iEngineNode, eventContext: iEventContext): boolean {
        const group = this.getInput<string>('group', eventContext);
        const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', false) ?? eventContext.instance;

        if (instance == Node_Enums.THROWN){
            return false;
        }

        return !!instance.groups.find(i => i == group);
    }

    const isInGroupNode = {
        id: 'is_in_group',
        category: 'object',
        inputs: [
            {id: 'group', type: SOCKET_TYPE.STRING, default: ''},
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, required: true, default: null}
        ],
        outputs: [
            {id: '_o', type: SOCKET_TYPE.BOOL, execute: isInGroup},
        ],
    };
    catObject.push(isInGroupNode);
}

{// Raycast
    function raycast(this: iEngineNode, eventContext: iEventContext): Instance_Base[] {
        const widgetDir = this.widgetData;
        const startX = this.getInput<number>('start_x', eventContext);
        const startY = this.getInput<number>('start_y', eventContext);
        const distance = this.getInput<number>('distance', eventContext);
        const onlySolid = this.getInput<boolean>('only_solid', eventContext);
        const startPos = new Vector(
            startX || eventContext.instance.pos.x,
            startY || eventContext.instance.pos.y,
        );
        const ignoreSelf = (startX || true) || (startY || true);
        const rayVector = new Vector(widgetDir[0], widgetDir[1]).multiplyScalar(distance);
        const nearInstances = this.engine.room.getInstancesInRadius(startPos, distance)
            .filter(i => {
                const selfCheck = !ignoreSelf || i.id != eventContext.instance.id;
                const solidCheck = !onlySolid || i.isSolid;
                return selfCheck && solidCheck;
            });
        const halfSpriteDim = Sprite.DIMENSIONS / 2;
        const spriteDim = new Vector(halfSpriteDim, halfSpriteDim);
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
        category: 'object',
        stackDataIO: true,
        widget: {
            id: 'direction',
            type: WIDGET.DIRECTION,
            options: {
                startDir: [1, 0],
            },
        },
        inputs: [
            {id: 'start_x', type: SOCKET_TYPE.NUMBER, required: false, default: ''},
            {id: 'start_y', type: SOCKET_TYPE.NUMBER, required: false, default: ''},
            {id: 'distance', type: SOCKET_TYPE.NUMBER, required: true, default: 1},
            {id: 'only_solid', type: SOCKET_TYPE.BOOL, default: false},
        ],
        outputs: [
            {id: 'instances', type: SOCKET_TYPE.INSTANCE, isList: true, execute: raycast},
        ],
    };
    catObject.push(raycastNode);
}

{// Set Animation Playback
    function setSettings(this: iEngineNode, eventContext: iEventContext): void {
        const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', false) ?? eventContext.instance;
        const frame = parseInt(this.getInput<string>('frame', eventContext));
        const fps = parseInt(this.getInput<string>('fps', eventContext));
        const loop = this.getInput<boolean | null>('loop', eventContext);
        const playing = this.getInput<boolean | null>('is_playing', eventContext);

        if (!instance || instance == Node_Enums.THROWN){
            this.triggerOutput('_o', eventContext);
            return;
        }

        if (!isNaN(frame)){
            instance.animFrame = frame;
        }
        
        if (!isNaN(fps)){
            instance.fpsOverride = fps;
        }
        
        if (loop != null){
            instance.animLoopOverride = loop;
        }
        
        if (playing != null){
            instance.animPlaying = playing;
        }

        instance.needsRenderUpdate = true;

        this.triggerOutput('_o', eventContext);
    }

    const setAnimationPlayback = {
        id: 'set_animation_playback',
        category: 'object',
        inTriggers: [
            {id: '_i', execute: setSettings},
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, required: true, default: null},
            {id: 'frame', type: SOCKET_TYPE.NUMBER, default: ''},
            {id: 'fps', type: SOCKET_TYPE.NUMBER, default: ''},
            {id: 'loop', type: SOCKET_TYPE.BOOL, default: null, triple: true},
            {id: 'is_playing', type: SOCKET_TYPE.BOOL, default: null, triple: true},
        ],
    };
    catObject.push(setAnimationPlayback);
}

{// Set Sprite
    function setSprite(this: iEngineNode, eventContext: iEventContext): void {
        const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', false) ?? eventContext.instance;
        const spriteId: number = this.widgetData;
        const sprite = this.engine.gameData.sprites.find(s => s.id == spriteId);

        if (instance != Node_Enums.THROWN){
            instance.sprite = sprite ?? null;
            this.engine.refreshRenderedInstance(instance);
        }

        this.triggerOutput('_o', eventContext);
    }

    const setSpriteNode = {
        id: 'set_sprite',
        category: 'object',
        widget: {
            id: 'sprite',
            type: WIDGET.ENUM,
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
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null, required: true},
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

            this.widget.options.items = [genericNoOption, ...sprites];
        },
    };
    catObject.push(setSpriteNode);
}

{// Flip Sprite
    function flipSprite(this: iEngineNode, eventContext: iEventContext): void {
        const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', false) ?? eventContext.instance;
        const hFlip = this.getInput<boolean>('hFlip', eventContext);
        const vFlip = this.getInput<boolean>('vFlip', eventContext);

        if (instance != Node_Enums.THROWN){
            instance.flipH = hFlip;
            instance.flipV = vFlip;
            instance.needsRenderUpdate = true;
        }

        this.triggerOutput('_o', eventContext);
    }

    const flipSpriteNode = {
        id: 'flip_sprite',
        category: 'object',
        inTriggers: [
            {id: '_i', execute: flipSprite},
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null, required: true},
            {id: 'hFlip', type: SOCKET_TYPE.BOOL, default: false},
            {id: 'vFlip', type: SOCKET_TYPE.BOOL, default: false},
        ],
    };
    catObject.push(flipSpriteNode);
}