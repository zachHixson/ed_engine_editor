import {SOCKET_TYPE, WIDGET} from './Node_Enums';
import { iNodeTemplate } from './iNodeTemplate';
import Cat_Events from './Cat_Events';
import Cat_Variables from './Cat_Variables';
import { Vector } from '../Vector';
import { iEditorNode, iEngineNode, iNodeConnection } from '../LogicInterfaces';
import { Game_Object, Instance_Base, Instance_Object } from '../core';
import { canConvertSocket, assetToInstance, instanceToAsset } from './Socket_Conversions';

export type Node = iEditorNode | iEngineNode;

export function isEngineNode(node: any): node is iEngineNode {
    return !!node.engine;
}

export const NODE_LIST: iNodeTemplate[] = [
    ...Cat_Events,
    {// Branch
        id: 'branch',
        category: 'actual',
        inTriggers: [
            {id: '_i', execute: 'checkCondition'},
        ],
        outTriggers: ['true', 'false'],
        inputs: [
            {id: 'condition', type: SOCKET_TYPE.BOOL, default: false},
        ],
        methods: {
            checkCondition(this: iEngineNode, instanceContext: Instance_Object){
                const conditionVal = this.getInput('condition', instanceContext);
                const out = conditionVal ? 'true' : 'false';
                this.triggerOutput(out, instanceContext);
            },
        },
    },
    {// Compare
        id: 'compare',
        category: 'actual',
        inputs: [
            {id: '_inp', type: SOCKET_TYPE.NUMBER, default: 0},
            {id: '_inp2', type: SOCKET_TYPE.NUMBER, default: 0},
        ],
        widget: {
            id: 'compare_function',
            type: WIDGET.ENUM,
            options: {
                items: ['equal_sym', 'gt', 'lt', 'gte', 'lte'],
            },
        },
        outputs: [
            {id: 'equal', type: SOCKET_TYPE.BOOL, execute: 'compare'},
        ],
        methods: {
            compare(this: iEngineNode, instanceContext: Instance_Object){
                const compareFunc = this.getWidgetData();
                const inp1 = this.getInput('_inp1', instanceContext);
                const inp2 = this.getInput('_inp2', instanceContext);

                switch(compareFunc){
                    case 'equal': return inp1 == inp2;
                    case 'gt': return inp1 > inp2;
                    case 'lt': return inp1 < inp2;
                    case 'gte': return inp1 >= inp2;
                    case 'lte': return inp1 <= inp2;
                }
            },
        },
    },
    {// Compare Instances
        id: 'compare_instances',
        category: 'actual',
        widget: {
            id: 'type',
            type: WIDGET.ENUM,
            options: {
                items: ['compare_instance', 'compare_type'],
            },
        },
        onBeforeMount(this: iEditorNode){
            this.method('editor_setSocketType');
        },
        onValueChange(this: iEditorNode){
            this.method('editor_setSocketType');
        },
        inputs: [
            {id: '_i1', type: SOCKET_TYPE.ASSET, default: null},
            {id: '_i2', type: SOCKET_TYPE.ASSET, default: null},
        ],
        outputs: [
            {id: 'result', type: SOCKET_TYPE.BOOL, execute: 'getResult'},
        ],
        methods: {
            getResult(this: iEngineNode, instanceContext: Instance_Object){
                const i1 = this.getInput('_i1', instanceContext);
                const i2 = this.getInput('_i2', instanceContext);

                return i1.id == i2.id;
            },
            editor_setSocketType(this: iEditorNode){
                const type = this.widgetData;
                const deleteConnections: iNodeConnection[] = [];
                let typeChanged = false;

                //change socket icons
                this.inputs?.forEach(input => {
                    const connection = this.editorAPI.getConnection(this, input.id);
                    const connectedSocket = connection ? this.editorAPI.getConnectedSocket(this, input.id, connection) : null;
                    typeChanged ||= type != input.type;
                    input.type = type == 'compare_type' ? SOCKET_TYPE.ASSET : SOCKET_TYPE.INSTANCE;
                    typeChanged && this.emit('force-socket-update', input.id);

                    if (connection && connectedSocket && !canConvertSocket(connectedSocket.type, input.type)){
                        deleteConnections.push(connection);
                    }
                });

                typeChanged && deleteConnections.length && this.editorAPI.deleteConnections(deleteConnections, true);
            }
        },
    },
    {// Logic
        id: 'logic',
        category: 'actual',
        widget: {
            id: 'logic_function',
            type: WIDGET.ENUM,
            options: {
                items: ['and', 'or', 'xor']
            },
        },
        inputs: [
            {id: '_inp1', type: SOCKET_TYPE.BOOL, default: false},
            {id: '_inp2', type: SOCKET_TYPE.BOOL, default: false},
        ],
        outputs: [
            {id: '_result', type: SOCKET_TYPE.BOOL, execute: 'result'},
        ],
        methods: {
            result(this: iEngineNode, instanceContext: Instance_Object){
                const logicFunc = this.getWidgetData();
                const inp1 = this.getInput('_inp1', instanceContext);
                const inp2 = this.getInput('_inp2', instanceContext);

                switch(logicFunc){
                    case 'and': return inp1 && inp2;
                    case 'or': return inp1 || inp2;
                    case 'xor': return !!(inp1 ^ inp2);
                }
            },
        },
    },
    {// Not
        id: 'not',
        category: 'actual',
        inputs: [
            {id: '_inp', type: SOCKET_TYPE.BOOL, default: false},
        ],
        outputs: [
            {id: '_out', type: SOCKET_TYPE.BOOL, execute: 'not'},
        ],
        methods: {
            not(this: iEngineNode, instanceContext: Instance_Object){
                return !this.getInput('_inp', instanceContext);
            },
        },
    },
    {// Debug Log
        id: 'debug_log',
        category: 'actual',
        inTriggers: [
            {id: '_i', execute: 'log'}
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'label', type: SOCKET_TYPE.STRING, default: ''},
            {id: '_data', type: SOCKET_TYPE.ANY, default: null},
        ],
        methods: {
            log(this: iEngineNode, instanceContext: Instance_Object){
                const label = this.getInput('label', instanceContext);
                const data = this.getInput('_data', instanceContext);
                const hasData = data != null || typeof data == 'boolean';
                const outData = data?.name ? `{{${data.name}}}` : data;

                if (label.length > 0 && hasData){
                    this.engine.log(label, outData);
                }
                else if (hasData){
                    this.engine.log(outData);
                }
                else{
                    this.engine.log(label);
                }

                this.triggerOutput('_o', instanceContext);
            },
        },
    },
    {// Key Down
        id: 'key_down',
        category: 'actual',
        widget: {
            id: 'key_selector',
            type: WIDGET.KEY,
        },
        outputs: [
            {id: 'is_down', type: SOCKET_TYPE.BOOL, execute: 'isDown'},
        ],
        methods: {
            isDown(this: iEngineNode, instanceContext: Instance_Object){
                const keymap = this.engine.keyMap;
                const input = this.getInput('key', instanceContext).toLowerCase();
                return !!keymap.get(input);
            },
        },
    },
    {// Math
        id: 'math',
        category: 'actual',
        widget: {
            id: 'math_function',
            type: WIDGET.ENUM,
            options: {
                items: ['add_sym', 'subtract_sym', 'multiply_sym', 'divide_sym', 'power'],
            },
        },
        inputs: [
            {id: '_num1', type: SOCKET_TYPE.NUMBER, default: 0, required: true},
            {id: '_num2', type: SOCKET_TYPE.NUMBER, default: 0, required: true},
        ],
        outputs: [
            {id: '_out', type: SOCKET_TYPE.NUMBER, execute: 'compute'},
        ],
        methods: {
            compute(this: iEngineNode, instanceContext: Instance_Object){
                const mathFunc = this.getWidgetData();
                const num1 = this.getInput('_num1', instanceContext);
                const num2 = this.getInput('_num2', instanceContext);

                switch(mathFunc){
                    case 'add_sym': return num1 + num2;
                    case 'subtract_sym': return num1 - num2;
                    case 'multiply_sym': return num1 * num2;
                    case 'divide_sym':
                        if (num2 == 0){
                            this.engine.nodeException('Cannot divide by 0', null);
                            return;
                        }
                        return num1 / num2;
                    case 'power': return Math.pow(num1, num2);
                }
            },
        },
    },
    {// Remove Instance
        id: 'remove_instance',
        category: 'actual',
        inTriggers: [
            {id: '_i', execute: 'removeInstance'},
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null, required: true},
        ],
        methods: {
            removeInstance(this: iEngineNode, instanceContext: Instance_Object){
                const instance = this.getInput('instance', instanceContext) || instanceContext;
                this.engine.removeInstance(instance);
                this.triggerOutput('_o', instanceContext);
            }
        },
    },
    {// Dialog Box
        id: 'dialog_box',
        category: 'actual',
        widget: {
            id: 'text',
            type: WIDGET.TEXT_AREA,
        },
        inTriggers: [
            {id: '_i', execute: 'startDialog'},
        ],
        outTriggers: ['immediate', 'dialog_closed'],
        inputs: [
            {id: 'text', type: SOCKET_TYPE.STRING, default: ''},
        ],
        methods: {
            startDialog(this: iEngineNode, instanceContext: Instance_Object){
                const textArea = this.getWidgetData();
                const textBox = this.getInput('text', instanceContext);
                const text = textBox ? textBox : textArea;
                this.engine.openDialogBox(text, 'dialogClosed', this, instanceContext);
                this.triggerOutput('immediate', instanceContext);
            },
            dialogClosed(this: iEngineNode, instanceContext: Instance_Object){
                this.triggerOutput('dialog_closed', instanceContext);
            },
        }
    },
    {// Object Input
        id:'object_input',
        category: 'actual',
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
            { id: '_o', type: SOCKET_TYPE.ASSET, execute: 'getObject' },
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
                thumbnail: (()=>{
                    const thumbFrame = o.sprite?.frames[o.startFrame];

                    if (!(thumbFrame && o.sprite)){
                        return Instance_Object.DEFAULT_INSTANCE_ICON[0];
                    }

                    return o.sprite.frameIsEmpty(o.startFrame) ? Instance_Object.DEFAULT_INSTANCE_ICON[0] : o.sprite?.frames[o.startFrame];
                })()
            }));

            this.widget.options.items = [genericNoOption, ...objects];
        },
        methods: {
            getObject(this: iEngineNode){
                const objects = this.engine.gameData.objects;
                const selectedObjectId = this.widgetData;

                return objects.filter(o => o.id == selectedObjectId)[0] ?? null;
            },
        }
    },
    {// Get Self
        id: 'get_self',
        category: 'actual',
        outputs: [
            {id: 'self', type: SOCKET_TYPE.INSTANCE, execute: 'getSelf'},
        ],
        methods: {
            getSelf(this: iEngineNode, instanceContext: Instance_Object){
                return instanceContext;
            },
        },
    },
    {// Instance Properties
        id: 'instance_properties',
        category: 'actual',
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null, required: true},
        ],
        outputs: [
            {id: 'Type', type: SOCKET_TYPE.ASSET, execute: 'getAsset'},
            {id: 'name', type: SOCKET_TYPE.STRING, execute: 'getName'},
            {id: 'x', type: SOCKET_TYPE.NUMBER, execute: 'getX'},
            {id: 'y', type: SOCKET_TYPE.NUMBER, execute: 'getY'},
        ],
        init(this: Node){
            if (!isEngineNode(this)){
                this.stackDataIO = true;
            }
        },
        methods: {
            getAsset(this: iEngineNode, instanceContext: Instance_Object){
                const instance = this.getInput('instance', instanceContext) ?? instanceContext;
                return instanceToAsset(instance, this.engine.gameData);
            },
            getName(this: iEngineNode, instanceContext: Instance_Object){
                return (this.getInput('instance', instanceContext) ?? instanceContext).name
            },
            getX(this: iEngineNode, instanceContext: Instance_Object){
                return (this.getInput('instance', instanceContext) ?? instanceContext).pos.x
            },
            getY(this: iEngineNode, instanceContext: Instance_Object){
                return (this.getInput('instance', instanceContext) ?? instanceContext).pos.y
            },
        },
    },
    {// Spawn Instance
        id: 'spawn_instance',
        category: 'actual',
        inTriggers: [
            {id: '_i', execute: 'spawnInstance'}
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'type', type: SOCKET_TYPE.ASSET, default: null, required: false},
            {id: 'x', type: SOCKET_TYPE.NUMBER, default: 0, required: true},
            {id: 'y', type: SOCKET_TYPE.NUMBER, default: 0, required: true},
        ],
        outputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, execute: 'getAsset'},
        ],
        methods: {
            spawnInstance(this: iEngineNode, instanceContext: Instance_Object){
                const baseAsset = this.getInput('type', instanceContext);
                const x = this.getInput('x', instanceContext);
                const y = this.getInput('y', instanceContext);
                const pos = new Vector(x, y);
                const nextId = this.engine.room.curInstId;
                const newInstance = assetToInstance(baseAsset, nextId, pos);

                if (newInstance){
                    newInstance.setEngine(this.engine);
                    this.engine.addInstance(newInstance);
                    newInstance.onCreate();
                    this.dataCache.set('spawned_instance', newInstance);
                    this.parentScript.registerPostEventCallback(()=>{
                        this.dataCache.delete('spawned_instance');
                    });
                }
                else{
                    this.engine.warn('no_asset_specified');
                }

                this.triggerOutput('_o', instanceContext);
            },
            getAsset(this: iEngineNode){
                return this.dataCache.get('spawned_instance') ?? null;
            },
        }
    },
    {// Broadcast Message
        id: 'broadcast_message',
        category: 'actual',
        inTriggers: [
            {id: '_i', execute: 'broadcastMessage'},
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'name', type: SOCKET_TYPE.STRING, default: ''},
        ],
        methods: {
            broadcastMessage(this: iEngineNode, instanceContext: Instance_Object){
                const name = this.getInput('name', instanceContext);

                if (name.trim().length < 0) return;
                
                this.engine.emitMessage(this.getInput('name', instanceContext));
                this.triggerOutput('_o', instanceContext);
            }
        },
    },
    {// Timer
        id: 'timer',
        category: 'actual',
        inputs: [
            {id: 'duration', type: SOCKET_TYPE.NUMBER, required: true, default: 0},
            {id: 'step', type: SOCKET_TYPE.NUMBER, required: true, default: 0},
        ],
        outputs: [
            {id: 'elapsed', type: SOCKET_TYPE.NUMBER, execute: 'getElapsed'},
            {id: 'remaining', type: SOCKET_TYPE.NUMBER, execute: 'getRemaining'},
            {id: 'percent', type: SOCKET_TYPE.NUMBER, execute: 'getPercent'},
        ],
        inTriggers: [
            {id: 'start', execute: 'start'},
            {id: 'pause', execute: 'pause'},
            {id: 'reset', execute: 'reset'},
        ],
        outTriggers: ['immediate', 'tick', 'complete'],
        init(this: Node){
            if (!isEngineNode(this)){
                this.stackDataIO = true;
            }
        },
        onTick(this: iEngineNode, instanceContext: Instance_Object){
            const timerKey = `${instanceContext.id}/${this.nodeId}`;
            const data = this.dataCache.get(timerKey);
            const deltaTimeMS = this.engine.deltaTime * 1000;

            if (!data) return;

            if (!data.active){
                data.lastTickGap = data.step;
                return;
            }

            data.progress = Math.min(data.progress + deltaTimeMS, data.duration);

            if (data.progress >= data.duration){
                this.triggerOutput('complete', instanceContext);
                this.triggerOutput('tick', instanceContext);
                this.dataCache.delete(timerKey);
                return;
            }

            if (deltaTimeMS > data.step || data.lastTickGap >= data.step){
                this.triggerOutput('tick', instanceContext);
                data.lastTickGap = 0;
            }
            else{
                data.lastTickGap += deltaTimeMS;
            }
        },
        methods: {
            start(this: iEngineNode, instanceContext: Instance_Object){
                const timerKey = `${instanceContext.id}/${this.nodeId}`;
                const oldData = this.dataCache.get(timerKey);

                if (oldData){
                    oldData.active = true;
                }

                const duration = this.getInput('duration', instanceContext) * 1000;
                const step = this.getInput('step', instanceContext) * 1000;

                this.dataCache.set(timerKey, {
                    duration,
                    step,
                    progress: 0,
                    lastTickGap: 0,
                    active: true,
                });

                this.triggerOutput('immediate', instanceContext);
            },
            pause(this: iEngineNode, instanceContext: Instance_Object){
                const data = this.dataCache.get(`${instanceContext.id}/${this.nodeId}`);
                
                if (data){
                    data.active = false;
                }
            },
            reset(this: iEngineNode, instanceContext: Instance_Object){
                const data = this.dataCache.get(`${instanceContext.id}/${this.nodeId}`);

                if (data){
                    data.duration = 0;
                }
            },
            getElapsed(this: iEngineNode, instanceContext: Instance_Object){
                const data = this.dataCache.get(`${instanceContext.id}/${this.nodeId}`);
                return data ? Math.round(data.progress / 10) / 100 : 0;
            },
            getRemaining(this: iEngineNode, instanceContext: Instance_Object){
                const data = this.dataCache.get(`${instanceContext.id}/${this.nodeId}`);
                return data ? Math.round((data.duration - data.progress) / 10) / 100 : 0;
            },
            getPercent(this: iEngineNode, instanceContext: Instance_Object){
                const data = this.dataCache.get(`${instanceContext.id}/${this.nodeId}`);
                return data ? data.progress / data.duration : 0;
            },
        },
    },
    {// Set Animation Playback
        id: 'set_animation_playback',
        category: 'drawing',
        inTriggers: [
            {id: '_i', execute: 'setSettings'},
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null},
            {id: 'frame', type: SOCKET_TYPE.NUMBER, default: ''},
            {id: 'fps', type: SOCKET_TYPE.NUMBER, default: ''},
            {id: 'loop', type: SOCKET_TYPE.BOOL, default: null, triple: true},
            {id: 'playing', type: SOCKET_TYPE.BOOL, default: null, triple: true},
        ],
        methods: {
            setSettings(this: iEngineNode, instanceContext: Instance_Object){
                const instance = (this.getInput('instance', instanceContext) ?? instanceContext) as Instance_Base;
                const frame = parseInt(this.getInput('frame', instanceContext));
                const fps = parseInt(this.getInput('fps', instanceContext));
                const loop = this.getInput('loop', instanceContext);
                const playing = this.getInput('playing', instanceContext);

                instance.animFrame = isNaN(frame) ? instance.animFrame : frame;
                instance.fpsOverride = isNaN(fps) ? instance.fps : fps;
                instance.animLoopOverride = loop ?? instance.animLoop;
                instance.animPlaying = playing ?? instance.animPlaying;

                instance.needsRenderUpdate = true;

                this.triggerOutput('_o', instanceContext);
            },
        },
    },
    {// Set Position
        id: 'set_position',
        category: 'movement',
        inTriggers: [
            {id: '_i', execute: 'setPosition'},
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null, required: true},
            {id: 'x', type: SOCKET_TYPE.NUMBER, default: '', required: false},
            {id: 'y', type: SOCKET_TYPE.NUMBER, default: '', required: false},
            {id: 'relative', type: SOCKET_TYPE.BOOL, default: false},
        ],
        methods: {
            setPosition(this: iEngineNode, instanceContext: Instance_Object){
                const instance = this.getInput('instance', instanceContext) ?? instanceContext;
                const xInp = this.getInput('x', instanceContext);
                const yInp = this.getInput('y', instanceContext);
                const relative = this.getInput('relative', instanceContext);
                let newPos: Vector;

                if (relative){
                    const offset = new Vector(
                        xInp === '' ? 0 : xInp,
                        yInp === '' ? 0 : yInp
                    );
                    newPos = offset.add(instance.pos);
                }
                else{
                    newPos = new Vector(
                        xInp === '' ? instance.pos.x : xInp,
                        yInp === '' ? instance.pos.y : yInp
                    );
                }

                this.engine.setInstancePosition(instanceContext, newPos);
                
                this.triggerOutput('_o', instanceContext);
            },
        },
    },
    {// Move Tiled
        id: 'move_tiled',
        category: 'movement',
        inTriggers: [
            {id: '_i', execute: 'moveTiled'},
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'x', type: SOCKET_TYPE.NUMBER, default: 0, required: true},
            {id: 'y', type: SOCKET_TYPE.NUMBER, default: 0, required: true},
        ],
        methods: {
            moveTiled(this: iEngineNode, instanceContext: Instance_Object){
                const newPos = new Vector(
                    Math.round(this.getInput('x', instanceContext)),
                    Math.round(this.getInput('y', instanceContext))
                ).add(instanceContext.pos);
                let instancesInSpace: Instance_Object[];
                let spaceEmpty: boolean;

                if (this.method('checkExitBacktrack', instanceContext, newPos)){
                    return;
                }

                instancesInSpace = this.engine.getInstancesOverlapping({
                    id: instanceContext.id,
                    pos: newPos
                } as Instance_Object);
                spaceEmpty = instancesInSpace.length > 0 ? instancesInSpace.filter(i => i.isSolid).length <= 0 : true;

                if (spaceEmpty || !instanceContext.isSolid){
                    this.engine.setInstancePosition(instanceContext, newPos);
                }
                else{
                    //register collisions with current instance
                    if (instanceContext.hasCollisionEvent){
                        for (let i = 0; i < instancesInSpace.length; i++){
                            this.engine.registerCollision(instanceContext, instancesInSpace[i], true);
                        }
                    }

                    //register collisions with collided instance
                    for (let i = 0; i < instancesInSpace.length; i++){
                        const curInstanceInSpace = instancesInSpace[i];

                        if (curInstanceInSpace.hasCollisionEvent){
                            this.engine.registerCollision(curInstanceInSpace, instanceContext, true);
                        }
                    }
                }
                
                this.triggerOutput('_o', instanceContext);
            },
            checkExitBacktrack(this: iEngineNode, instanceContext: Instance_Object, newPos: Vector): boolean {
                if (!(instanceContext.prevExit && instanceContext.prevExit?.exit.detectBacktracking)) return false;

                const direction = newPos.clone().subtract(instanceContext.pos).normalize();
                const dot = direction.dot(instanceContext.prevExit.direction.clone().multiplyScalar(-1));

                if (dot > 0.75) {
                    instanceContext.prevExit.exit.triggerExit(instanceContext, direction);
                    return true;
                }

                return false;
            },
        },
    },
    {// Set Velocity
        id: 'set_velocity',
        category: 'movement',
        inTriggers: [
            {id: '_i', execute: 'setVelocity'}
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null, required: true},
            {id: 'x', type: SOCKET_TYPE.NUMBER, default: 0, required: true},
            {id: 'y', type: SOCKET_TYPE.NUMBER, default: 0, required: true},
            {id: 'slide', type: SOCKET_TYPE.BOOL, default: false},
        ],
        methods: {
            setVelocity(this: iEngineNode, instanceContext: Instance_Object){
                const instance = this.getInput('instance', instanceContext) ?? instanceContext;
                instance.velocity.set(
                    this.getInput('x', instanceContext),
                    this.getInput('y', instanceContext)
                );
                instance.collisionSlide = this.getInput('slide', instanceContext);
                this.triggerOutput('_o', instanceContext);
            },
        },
    },
    ...Cat_Variables,
];

export const NODE_MAP = new Map<string, iNodeTemplate>();

NODE_LIST.forEach(node => {
    NODE_MAP.set(node.id, node);
});