import { iAnyObj } from "../interfaces";
import { SOCKET_TYPE, WIDGET } from "./Node_Enums";

export interface iNodeTemplate {
    id: string;
    category: string;
    isEvent?: boolean;
    inTriggers?: Array<{
        id: string;
        execute: string;
    }>;
    outTriggers?: Array<string>;
    inputs?: Array<{
        id: string;
        type: SOCKET_TYPE;
        default?: any;
        required?: boolean;
        triple?: boolean;
        hideSocket?: boolean;
        disabled?: boolean;
        hideInput?: boolean;
    }>;
    widget?: {
        id: string;
        type: WIDGET;
        options?: iAnyObj | any[];
    };
    outputs?: Array<{
        id: string;
        type: SOCKET_TYPE;
        execute: string;
        disabled?: boolean;
    }>;
    execute?(data: any): void;
    methods?: iAnyObj;

    //lifecycle events
    init?(): void;
    onScriptAdd?(): void;
    onCreate?(): void;
    afterSave?(saveData: iAnyObj): void;
    beforeLoad?(saveData: iAnyObj): void;
    afterLoad?(): void;
    afterGameDataLoaded?(): void;
    onMount?(): void;
    onInput?(event: Event): void;
    onNewVariable?(variable: string): void;
    onNewConnection?(connection: iAnyObj): void;
    onRemoveConnection?(connection: iAnyObj): void;
    onDeleteStopped?(protectedNodes: Node[]): void;
    onBeforeDelete?(): void;
}