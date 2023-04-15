import Tool_Base from './Tool_Base';
import { RoomMainEventBus } from '../RoomMain.vue';
import type { iActionArguments } from '../RoomMain.vue';
import { useGameDataStore } from '@/stores/GameData';
import i18n from '@/i18n';
import Core from '@/core';
import type { imEvent } from '../RoomEditWindow.vue';

type AddProps = {sourceId?: number, instRefList?: Core.Instance_Base[], pos?: Core.Vector};
type ExitAddProps = {exitRef?: Core.Instance_Exit, pos: Core.Vector};

const t = i18n.global.t;

export function useAdd(args: iActionArguments){

    class Add_Brush extends Tool_Base {
        private _cellCache = new Array<Core.Vector>();
        private _mouseDown = false;
    
        override mouseMove(mEvent: imEvent): void {
            if (!args.props.selectedAsset) return;

            let hasVisited = false;
    
            //check if cell has already been visited
            for (let i = 0; i < this._cellCache.length; i++){
                hasVisited ||= this._cellCache[i].equalTo(mEvent.worldCell);
            }
    
            if (!hasVisited && this._mouseDown){
                actionAdd({sourceId: args.props.selectedAsset.id, pos: mEvent.worldCell}, false);
                this._cellCache.push(mEvent.worldCell.clone());
            }
        }
    
        override mouseDown(mEvent: imEvent): void {
            this._mouseDown = true;
            this.mouseMove(mEvent);
        }
    
        override mouseUp(): void {
            actionAdd({}, true);
            this._mouseDown = false;
            this._cellCache = [];
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

    function actionAdd({sourceId, instRefList = [], pos}: AddProps, makeCommit = true): void {
        const gameDataStore = useGameDataStore();
        const cacheList = args.undoStore.cache.get('add_list');
    
        if (makeCommit){
            const data = {instRefList: cacheList};
            args.undoStore.commit({action: Core.ROOM_ACTION.ADD, data});
            args.undoStore.cache.delete('add_list');
            return;
        }
    
        if (sourceId){
            const newInst = (()=>{
                switch (args.props.selectedAsset.category_ID){
                    case Core.CATEGORY_ID.SPRITE:
                        const sprite = gameDataStore.getAllSprites.find(s => s.id == sourceId)!;
                        return new Core.Instance_Sprite(args.props.selectedRoom.curInstId, pos, sprite);
                    case Core.CATEGORY_ID.OBJECT:
                        const object = gameDataStore.getAllObjects.find(o => o.id == sourceId)!;
                        return new Core.Instance_Object(args.props.selectedRoom.curInstId, pos!, object);
                    case Core.CATEGORY_ID.LOGIC:
                        const logicName = args.props.selectedAsset.name;
                        return new Core.Instance_Logic(args.props.selectedRoom.curInstId, pos, sourceId, logicName);
                }
            })()!;
    
            instRefList.push(newInst);
    
            if (cacheList){
                cacheList.push(newInst);
            }
            else if (newInst){
                args.undoStore.cache.set('add_list', [newInst]);
            }
        }
    
        for (let i = 0; i < instRefList.length; i++){
            args.props.selectedRoom.addInstance(instRefList[i]);
            RoomMainEventBus.emit('instance-added', instRefList[i]);
        }
    }

    function actionExitAdd({exitRef, pos}: ExitAddProps, makeCommit = true): Core.Instance_Exit {
        const newExit = exitRef ?? new Core.Instance_Exit(args.props.selectedRoom.curInstId, pos);
        const newExitName = t('room_editor.new_exit_prefix') + newExit.id;
        args.props.selectedRoom.addInstance(newExit);
    
        newExit.name = newExitName;
        
        RoomMainEventBus.emit('instance-added', newExit);
    
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
            RoomMainEventBus.emit('instance-removed', instRef);
        }
    }

    function revertExitAdd({exitRef}: ExitAddProps): void {
        if (exitRef!.id == args.editorSelection.value?.id){
            args.editorSelection.value = null;
        }
    
        args.props.selectedRoom.removeInstance(exitRef!.id);
        RoomMainEventBus.emit('instance-removed', exitRef);
    }

    args.toolMap.set(Core.ROOM_TOOL_TYPE.ADD_BRUSH, Add_Brush);
    args.toolMap.set(Core.ROOM_TOOL_TYPE.EXIT, Add_Exit);
    args.actionMap.set(Core.ROOM_ACTION.ADD, actionAdd);
    args.actionMap.set(Core.ROOM_ACTION.EXIT_ADD, actionExitAdd);
    args.revertMap.set(Core.ROOM_ACTION.ADD, revertAdd);
    args.revertMap.set(Core.ROOM_ACTION.EXIT_ADD, revertExitAdd);
}