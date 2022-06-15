import {SOCKET_TYPE, WIDGET} from './Node_Enums';
import {EVENTS} from './Events';

export const NODE_LIST = [
    ...EVENTS,
    {
        id: 'trigger_2io',
        category: 'testing',
        inTriggers: [
            {id: 'trigger_2io_inTrigger_01', execute: 'do_thing'},
            {id: 'trigger_2io_inTrigger_02', execute: 'do_thing'},
        ],
        outTriggers: ['trigger_2io_outTrigger_01', 'trigger_2io_outTrigger_02'],
        inputs: [
            {id: 'trigger_2io_iNum1', type: SOCKET_TYPE.NUMBER, default: 1},
            {id: 'trigger_2io_iNum2', type: SOCKET_TYPE.NUMBER, default: 2},
        ],
        outputs: [
            {id: 'trigger_2io_oNum1', type: SOCKET_TYPE.NUMBER, execute: 'do_thing'},
            {id: 'trigger_2io_oNum2', type: SOCKET_TYPE.NUMBER, execute: 'do_thing'},
        ],
    },
    {
        id: 'all_types',
        category: 'testing',
        inputs: [
            {id: 'all_types_iNumber', type: SOCKET_TYPE.NUMBER, default: 88},
            {id: 'all_types_iAny', type: SOCKET_TYPE.ANY, default: null},
            {id: 'all_types_iObject', type: SOCKET_TYPE.OBJECT, default: null},
            {id: 'all_types_iString', type: SOCKET_TYPE.STRING, default: 'Default'},
            {id: 'all_types_iBool', type: SOCKET_TYPE.BOOL, defualt: false},
        ],
        outputs: [
            {id: 'all_types_oNumber', type: SOCKET_TYPE.NUMBER, execute: 'do_thing'},
            {id: 'all_types_oAny', type: SOCKET_TYPE.ANY, execute: 'do_thing'},
            {id: 'all_types_oObject', type: SOCKET_TYPE.OBJECT, execute: 'do_thing'},
            {id: 'all_types_oString', type: SOCKET_TYPE.STRING, execute: 'do_thing'},
            {id: 'all_types_oBool', type: SOCKET_TYPE.BOOL, execute: 'do_thing'},
        ],
    },
    ///////////// actual nodes
    {
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
    {
        id: 'compare',
        category: 'actual',
        inputs: [
            {id: '_inp', type: SOCKET_TYPE.ANY, default: null},
            {id: '_inp2', type: SOCKET_TYPE.ANY, default: null},
        ],
        widget: {
            id: 'compare_function',
            type: WIDGET.ENUM,
            options: ['equal_sym', 'gt', 'lt', 'gte', 'lte'],
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
    {
        id: 'logic',
        category: 'actual',
        widget: {
            id: 'logic_function',
            type: WIDGET.ENUM,
            options: ['and', 'or', 'xor'],
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
    {
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
    {
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
            log(){
                const label = this.getInput('label');
                const data = this.getInput('_data');
                const hasData = data || typeof data == 'boolean';

                if (label.length > 0 && hasData){
                    this.engine.log(label, dataOut);
                }
                else if (hasData){
                    this.engine.log(dataOut);
                }
                else{
                    this.engine.log(label);
                }

                this.triggerOutput('_o');
            },
        },
    },
    {
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
    {
        id: 'math',
        category: 'actual',
        widget: {
            id: 'math_function',
            type: WIDGET.ENUM,
            options: ['add_sym', 'subtract_sym', 'multiply_sym', 'divide_sym', 'power'],
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
    {
        id: 'remove_instance',
        category: 'actual',
        inTriggers: [
            {id: '_i', execute: 'removeInstance'},
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.OBJECT, default: null},
        ],
        methods: {
            removeInstance(){
                const instance = this.getInput('instance') || this.instance;
                this.engine.removeInstance(instance);
                this.triggerOutput('_o');
            }
        }
    },
    {
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
    {
        id: 'set_position',
        category: 'movement',
        inTriggers: [
            {id: '_i', execute: 'setPosition'},
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'x', type: SOCKET_TYPE.NUMBER, default: 0, required: true},
            {id: 'y', type: SOCKET_TYPE.NUMBER, default: 0, required: true},
            {id: 'relative', type: SOCKET_TYPE.BOOL, default: false},
        ],
        methods: {
            setPosition(){
                const relative = this.getInput('relative');
                const newPos = new Victor(
                    Math.round(this.getInput('x')),
                    -Math.round(this.getInput('y'))
                );

                if (relative){
                    newPos.add(this.instance.pos);
                }
                
                this.triggerOutput('_o');
            },
        },
    },
    {
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
            moveTiled(){
                const newPos = new Victor(
                    Math.round(this.getInput('x')),
                    -Math.round(this.getInput('y'))
                ).add(this.instance.pos);
                let instancesInSpace;
                let spaceEmpty;

                instancesInSpace = this.engine.getInstancesOverlapping({
                    id: this.instance.id,
                    pos: newPos
                });
                spaceEmpty = instancesInSpace.length > 0 ? instancesInSpace.filter(i => i.isSolid) <= 0 : true;

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
        },
    },
    {
        id: 'set_variable',
        category: 'variables',
        inTriggers: [
            {id: '_i', execute: 'setVar'},
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'name', type: SOCKET_TYPE.STRING, default: ''},
            {id: 'data', type: SOCKET_TYPE.ANY, default: null},
            {id: 'global', type: SOCKET_TYPE.BOOL, default: false},
        ],
        methods: {
            setVar(){
                const varName = this.getInput('name').toLowerCase();
                const data = this.getInput('data');
                const global = this.getInput('global');

                if (global){
                    this.engine.setGlobalVariable(varName, data);
                }
                else{
                    this.engine.setInstanceVariable(this.instance, varName, data);
                }

                this.triggerOutput('_o');
            },
        },
    },
    {
        id: 'get_variable',
        category: 'variables',
        inputs: [
            {id: 'name', type: SOCKET_TYPE.STRING, default: ''},
            {id: 'global', type: SOCKET_TYPE.BOOL, default: false},
        ],
        outputs: [
            {id: 'data', type: SOCKET_TYPE.ANY, execute: 'getVar'},
        ],
        methods: {
            getVar(){
                const name = this.getInput('name').toLowerCase();
                const global = this.getInput('global');
                const value = global ? this.engine.getGlobalVariable(name)
                    : this.engine.getInstanceVariable(this.instance, name);

                if (value == undefined){
                    return null;
                }
                
                return value;
            },
        },
    },
    {
        id: 'number',
        category: 'variables',
        inputs: [
            {id: '_number', type: SOCKET_TYPE.NUMBER, default: 0, required: true},
        ],
        outputs: [
            {id: '_out', type: SOCKET_TYPE.NUMBER, execute: 'value'},
        ],
        methods: {
            value(){
                return this.getInput('_number');
            },
        }
    },
    {
        id: 'string',
        category: 'variables',
        inputs: [
            {id: '_string', type: SOCKET_TYPE.STRING, default: ''},
        ],
        outputs: [
            {id: '_out', type: SOCKET_TYPE.STRING, execute: 'value'},
        ],
        methods: {
            value(){
                return this.getInput('_boolean');
            },
        }
    },
    {
        id: 'boolean',
        category: 'variables',
        inputs: [
            {id: '_boolean', type: SOCKET_TYPE.BOOL, default: false},
        ],
        outputs: [
            {id: '_out', type: SOCKET_TYPE.BOOL, execute: 'value'},
        ],
        methods: {
            value(){
                return this.getInput('_boolean');
            },
        }
    },
];

export const NODE_MAP = {};

NODE_LIST.forEach(node => {
    NODE_MAP[node.id] = node;
});