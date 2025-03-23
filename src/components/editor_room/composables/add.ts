import Tool_Base from './Tool_Base';
import { RoomMainEventBus } from '../RoomMain.vue';
import type { iActionArguments } from '../RoomMain.vue';
import { useRoomEditorStore } from '@/stores/RoomEditor';
import i18n from '@/i18n';
import Core from '@/core';
import type { imEvent } from '../RoomEditWindow.vue';
import { checkNameCollisions } from '../Properties.vue';

type AddProps = {newInstance?: Core.Instance_Base, instRefList?: Core.Instance_Base[], pos?: Core.Vector};
type ExitAddProps = {exitRef?: Core.Instance_Exit, pos: Readonly<Core.Vector>};

const t = i18n.global.t;

export function useAdd(args: iActionArguments){

    const roomEditorStore = useRoomEditorStore();

    class Add_Brush extends Tool_Base {
        private _mouseDown = false;
        private _curCell: Core.Vector | null = null;

        private _instanceFromAsset(pos: Core.Vector): Core.Instance_Base | null {
            const asset = args.props.selectedAsset;

            switch (asset.category_ID){
                case Core.CATEGORY_ID.SPRITE:
                    const sprite = asset as Core.Sprite;
                    return new Core.Instance_Sprite(args.props.selectedRoom.curInstId, pos, sprite);
                case Core.CATEGORY_ID.OBJECT:
                    const object = asset as Core.Game_Object;
                    return new Core.Instance_Object(args.props.selectedRoom.curInstId, pos!, object);
                case Core.CATEGORY_ID.LOGIC:
                    const logicName = asset.name;
                    const logicId = asset.id;
                    return new Core.Instance_Logic(args.props.selectedRoom.curInstId, pos, logicId, logicName);
                default:
                    return null;
            }
        }

        private _instanceFromCopy(pos: Readonly<Core.Vector>): Core.Instance_Base | null {
            const selectedInstance = args.editorSelection.value;

            if (!selectedInstance) return null;

            const newInstance = selectedInstance.clone();
            newInstance.id = args.props.selectedRoom.curInstId;
            newInstance.name = (()=>{
                const roomInstances = args.props.selectedRoom.instances;
                const newName = newInstance.name + '_' + newInstance.id;;
                return checkNameCollisions(newInstance.id, newName, roomInstances, t('room_editor.duplicate_name_suffix'));
            })();
            newInstance.pos.copy(pos);

            return newInstance;
        }

        private _getInstancesAtPos(cell: Core.Vector, id: number): Core.Instance_Base[] {
            return args.props.selectedRoom.getInstancesInRadius(cell, 0)
                .filter(inst =>{
                    const samePos = inst.pos.equalTo(cell);
                    const assetSource = inst.sourceId == id;
                    return samePos && assetSource;
                });
        }
    
        override mouseMove(mEvent: imEvent): void {
            const sourceId = roomEditorStore.addBrushCopy ?
                args.editorSelection?.value?.id : args.props.selectedAsset?.id;

            if (sourceId == undefined) return;

            const instancesInCell = roomEditorStore.addBrushOverlap ? [] : this._getInstancesAtPos(mEvent.worldCell, sourceId);
            const newCell = this._curCell ? !this._curCell.equalTo(mEvent.worldCell) : true;
    
            if (this._mouseDown && newCell && !instancesInCell.length){
                const createFunc = roomEditorStore.addBrushCopy ? this._instanceFromCopy : this._instanceFromAsset;
                const newInstance = createFunc(mEvent.worldCell)!;

                if (roomEditorStore.addBrushDepth != null){
                    newInstance.zDepthOverride = roomEditorStore.addBrushDepth;
                }

                actionAdd({newInstance, pos: mEvent.worldCell}, false);
                this._curCell = mEvent.worldCell.clone();
            }
        }
    
        override mouseDown(mEvent: imEvent): void {
            this._mouseDown = true;
            this.mouseMove(mEvent);
            this._curCell = mEvent.worldCell.clone();
        }
    
        override mouseUp(): void {
            actionAdd({}, true);
            this._mouseDown = false;
            this._curCell = null;
        }
    }

    class Add_Exit extends Tool_Base {
        override mouseDown(mEvent: imEvent): void {
            const exitAtCursor = args.props.selectedRoom.getInstancesInRadius(mEvent.worldCell, 0)
                .find(e => e.pos.equalTo(mEvent.worldCell) && e.TYPE == Core.INSTANCE_TYPE.EXIT);
    
            if (exitAtCursor){
                args.editorSelection.value = exitAtCursor;
            }
            else{
                args.editorSelection.value = actionExitAdd({pos: mEvent.worldCell});
            }
        }
    }

    function actionAdd({newInstance, instRefList = [], pos}: AddProps, makeCommit = true): void {
        const cacheList = args.undoStore.cache.get('add_list') as Core.Instance_Base[];
    
        if (makeCommit && cacheList){
            const data = {instRefList: cacheList};
            args.undoStore.commit({action: Core.ROOM_ACTION.ADD, data});
            args.undoStore.cache.delete('add_list');
            return;
        }
    
        if (newInstance){
            instRefList.push(newInstance);
    
            if (cacheList){
                cacheList.push(newInstance);
            }
            else if (newInstance){
                args.undoStore.cache.set('add_list', [newInstance]);
            }
        }
    
        for (let i = 0; i < instRefList.length; i++){
            args.props.selectedRoom.addInstance(instRefList[i]);
            RoomMainEventBus.onInstanceAdded.emit(instRefList[i]);
        }
    }

    function actionExitAdd({exitRef, pos}: ExitAddProps, makeCommit = true): Core.Instance_Exit {
        const newExit = exitRef ?? new Core.Instance_Exit(args.props.selectedRoom.curInstId, pos);
        const newExitName = t('room_editor.new_exit_prefix') + newExit.id;
        args.props.selectedRoom.addInstance(newExit);
    
        newExit.name = newExitName;
        
        RoomMainEventBus.onInstanceAdded.emit(newExit);
    
        if (makeCommit){
            const data = {exitRef: newExit, pos: pos.clone()} satisfies ExitAddProps;
            args.undoStore.commit({action: Core.ROOM_ACTION.EXIT_ADD, data});
        }
    
        return newExit;
    }

    function revertAdd({instRefList = []}: AddProps): void {
        for (let i = 0; i < instRefList.length; i++){
            const instRef = instRefList[i];
            const editorSelection = args.editorSelection;
    
            if (instRef.id == editorSelection.value?.id){
                editorSelection.value = null;
            }
    
            args.props.selectedRoom.removeInstance(instRef.id);
            RoomMainEventBus.onInstanceRemoved.emit(instRef);
        }
    }

    function revertExitAdd({exitRef}: ExitAddProps): void {
        if (exitRef!.id == args.editorSelection.value?.id){
            args.editorSelection.value = null;
        }
    
        args.props.selectedRoom.removeInstance(exitRef!.id);
        RoomMainEventBus.onInstanceRemoved.emit(exitRef!);
    }

    args.toolMap.set(Core.ROOM_TOOL_TYPE.ADD_BRUSH, Add_Brush);
    args.toolMap.set(Core.ROOM_TOOL_TYPE.EXIT, Add_Exit);
    args.actionMap.set(Core.ROOM_ACTION.ADD, actionAdd);
    args.actionMap.set(Core.ROOM_ACTION.EXIT_ADD, actionExitAdd);
    args.revertMap.set(Core.ROOM_ACTION.ADD, revertAdd);
    args.revertMap.set(Core.ROOM_ACTION.EXIT_ADD, revertExitAdd);
}