import {SOCKET_TYPE, WIDGET} from './Node_Enums';
import { iNodeTemplate } from './iNodeTemplate';
import Cat_Events from './Cat_Events';
import Cat_Variables from './Cat_Variables';
import { Vector } from '../Vector';
import { iEditorNode, iEngineNode } from '../LogicInterfaces';
import { Game_Object, Instance_Object } from '../core';
import { assetToInstance, instanceToAsset } from './Socket_Conversions';

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
            {id: '_i', execute: 'checkCondition'}
        ],
        outTriggers: ['true', 'false'],
        inputs: [
            {id: 'condition', type: SOCKET_TYPE.BOOL, default: false}
        ],
        methods: {
            checkCondition(){
                const conditionVal = this.getInput('condition');
                const out = conditionVal ? 'true' : 'false';
                this.triggerOutput(out);
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
                items: ['equal_sym', 'gt', 'lt', 'gte', 'lte']
            },
        },
        outputs: [
            {id: 'equal', type: SOCKET_TYPE.BOOL, execute: 'compare'},
        ],
        methods: {
            compare(){
                const compareFunc = this.getWidgetData();
                const inp1 = this.getInput('_inp1');
                const inp2 = this.getInput('_inp2');

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
            result(){
                const logicFunc = this.getWidgetData();
                const inp1 = this.getInput('_inp1');
                const inp2 = this.getInput('_inp2');

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
            not(){return !this.getInput('_inp')},
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
            log(this: iEngineNode){
                const label = this.getInput('label');
                const data = this.getInput('_data');
                const hasData = data || typeof data == 'boolean';
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

                this.triggerOutput('_o');
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
            isDown(){
                const keymap = this.engine.keymap;
                const input = this.getInput('key').toLowerCase();
                return !!keymap[input];
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
                items: ['add_sym', 'subtract_sym', 'multiply_sym', 'divide_sym', 'power']
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
            compute(){
                const mathFunc = this.getWidgetData();
                const num1 = this.getInput('_num1');
                const num2 = this.getInput('_num2');

                switch(mathFunc){
                    case 'add_sym': return num1 + num2;
                    case 'subtract_sym': return num1 - num2;
                    case 'multiply_sym': return num1 * num2;
                    case 'divide_sym':
                        if (num2 == 0){
                            this.engine.nodeExeption(this, 'Cannot divide by 0');
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
            removeInstance(){
                const instance = this.getInput('instance') || this.instance;
                this.engine.removeInstance(instance);
                this.triggerOutput('_o');
            }
        }
    },
    {// Dialog Box
        id: 'dialog_box',
        category: 'actual',
        widget: {
            id: 'text',
            type: WIDGET.TEXT_AREA
        },
        inTriggers: [
            {id: '_i', execute: 'startDialog'}
        ],
        outTriggers: ['immediate', 'dialog_closed'],
        inputs: [
            {id: 'text', type: SOCKET_TYPE.STRING, default: ''}
        ],
        methods: {
            startDialog(){
                const textArea = this.getWidgetData();
                const textBox = this.getInput('text');
                const text = textBox ? textBox : textArea;
                this.engine.openDialogBox(text, this, 'dialogClosed');
                this.triggerOutput('immediate');
            },
            dialogClosed(){
                this.triggerOutput('dialog_closed');
            }
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
            }
        },
        outputs: [
            { id: '_o', type: SOCKET_TYPE.ASSET, execute: 'getObject' }
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
            }
        }
    },
    {// Get Self
        id: 'get_self',
        category: 'actual',
        outputs: [
            {id: 'self', type: SOCKET_TYPE.INSTANCE, execute: 'get_self'}
        ],
        methods: {
            get_self(this: iEngineNode){
                return this.instance;
            }
        }
    },
    {// Get Instance Properties
        id: 'instance_properties',
        category: 'actual',
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null, required: true}
        ],
        outputs: [
            {id: 'Type', type: SOCKET_TYPE.ASSET, execute: 'get_asset'},
            {id: 'name', type: SOCKET_TYPE.STRING, execute: 'get_name'},
            {id: 'x', type: SOCKET_TYPE.NUMBER, execute: 'get_x'},
            {id: 'y', type: SOCKET_TYPE.NUMBER, execute: 'get_y'},
        ],
        init(this: Node){
            if (!isEngineNode(this)){
                this.stackDataIO = true;
            }
        },
        methods: {
            get_asset(){
                return instanceToAsset(this.instance, this.engine.gameData);
            },
            get_name(){return this.instance.name},
            get_x(){return this.instance.pos.x},
            get_y(){return this.instance.pos.y},
        }
    },
    {// Spawn Instance
        id: 'spawn_instance',
        category: 'actual',
        inTriggers: [
            {id: '_i', execute: 'spawn_instance'}
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'type', type: SOCKET_TYPE.ASSET, default: null, required: false},
            {id: 'x', type: SOCKET_TYPE.NUMBER, default: 0, required: true},
            {id: 'y', type: SOCKET_TYPE.NUMBER, default: 0, required: true},
        ],
        outputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, execute: 'get_asset'}
        ],
        methods: {
            spawn_instance(this: iEngineNode){
                const baseAsset = this.getInput('type');
                const x = this.getInput('x');
                const y = this.getInput('y');
                const pos = new Vector(x, y);
                const nextId = this.engine.room.curInstId;
                const newInstance = assetToInstance(baseAsset, nextId, pos);

                if (newInstance){
                    this.engine.addInstance(newInstance);
                    this.dataCache.set('spawned_instance', newInstance);
                    this.parentScript.registerPostEventCallback(()=>{
                        this.dataCache.delete('spawned_instance');
                    });
                }
                else{
                    this.engine.warn('no_asset_specified');
                }

                this.triggerOutput('_o');
            },
            get_asset(){
                return this.dataCache.get('spawned_instance') ?? null;
            },
        }
    },
    {// Set Animation Playback
        id: 'set_animation_playback',
        category: 'drawing',
        inTriggers: [
            {id: '_i', execute: 'set_settings'},
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'frame', type: SOCKET_TYPE.NUMBER, default: ''},
            {id: 'fps', type: SOCKET_TYPE.NUMBER, default: ''},
            {id: 'loop', type: SOCKET_TYPE.BOOL, default: null, triple: true},
            {id: 'playing', type: SOCKET_TYPE.BOOL, default: null, triple: true},
        ],
        methods: {
            set_settings(){
                const frame = parseInt(this.getInput('frame'));
                const fps = parseInt(this.getInput('fps'));
                const loop = this.getInput('loop');
                const playing = this.getInput('playing');

                this.instance.animFrame = isNaN(frame) ? this.instance.animFrame : frame;
                this.instance.fps = isNaN(fps) ? this.instance.fps : fps;
                this.instance.animLoop = loop ?? this.instance.animLoop;
                this.instance.animPlaying = playing ?? this.instance.animPlaying;
            }
        }
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
            setPosition(this: iEngineNode){
                const instance = this.getInput('instance') ?? this.instance;
                const xInp = this.getInput('x');
                const yInp = this.getInput('y');
                const relative = this.getInput('relative');
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

                this.engine.setInstancePosition(this.instance, newPos);
                
                this.triggerOutput('_o');
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
            moveTiled(this: iEngineNode){
                const newPos = new Vector(
                    Math.round(this.getInput('x')),
                    Math.round(this.getInput('y'))
                ).add(this.instance.pos);
                let instancesInSpace: Instance_Object[];
                let spaceEmpty: boolean;

                if (this.method('checkExitBacktrack', newPos)){
                    return;
                }

                instancesInSpace = this.engine.getInstancesOverlapping({
                    id: this.instance.id,
                    pos: newPos
                } as Instance_Object);
                spaceEmpty = instancesInSpace.length > 0 ? instancesInSpace.filter(i => i.isSolid).length <= 0 : true;

                if (spaceEmpty || !this.instance.isSolid){
                    this.engine.setInstancePosition(this.instance, newPos);
                }
                else{
                    //register collisions with current instance
                    if (this.instance.hasCollisionEvent){
                        for (let i = 0; i < instancesInSpace.length; i++){
                            this.engine.registerCollision(this.instance, instancesInSpace[i], true);
                        }
                    }

                    //register collisions with collided instance
                    for (let i = 0; i < instancesInSpace.length; i++){
                        const curInstanceInSpace = instancesInSpace[i];

                        if (curInstanceInSpace.hasCollisionEvent){
                            this.engine.registerCollision(curInstanceInSpace, this.instance, true);
                        }
                    }
                }
                
                this.triggerOutput('_o');
            },
            checkExitBacktrack(this: iEngineNode, newPos: Vector): boolean {
                if (!(this.instance.prevExit && this.instance.prevExit?.exit.detectBacktracking)) return false;

                const direction = newPos.clone().subtract(this.instance.pos).normalize();
                const dot = direction.dot(this.instance.prevExit.direction.clone().multiplyScalar(-1));

                if (dot > 0.75) {
                    this.instance.prevExit.exit.triggerExit(this.instance, direction);
                    return true;
                }

                return false;
            }
        },
    },
    ...Cat_Variables,
];

export const NODE_MAP = new Map<string, iNodeTemplate>();

NODE_LIST.forEach(node => {
    NODE_MAP.set(node.id, node);
});