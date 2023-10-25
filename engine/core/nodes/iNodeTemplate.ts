import { iAnyObj } from "../interfaces";
import { SOCKET_TYPE, WIDGET } from "./Node_Enums";
import { Instance_Object } from "../core";
import { iEventContext, iNodeLifecycleEvents, iEditorNodeMethod, iEngineNodeMethod } from "../LogicInterfaces";

export interface iNodeTemplate extends iNodeLifecycleEvents {
    id: string;
    category: string;
    isEvent?: boolean;
    doNotCopy?: boolean;
    inTriggers?: Array<iInTrigger>;
    outTriggers?: Array<string>;
    inputs?: Array<iInput>;
    widget?: {
        id: string;
        type: WIDGET;
        options?: iAnyObj | any[];
    };
    outputs?: Array<iOutput>;
    execute?(eventContext: iEventContext, data: any): void;
    methods?: {[key: string]: iEditorNodeMethod | iEngineNodeMethod};
}

export interface iInTrigger {
    id: string;
    execute: string;
};

export interface iInput {
    id: string;
    type: SOCKET_TYPE;
    isList?: boolean;
    default?: any;
    required?: boolean;
    triple?: boolean;
    hideSocket?: boolean;
    disabled?: boolean;
    hideInput?: boolean;
    enableDecorators?: boolean;
    decoratorIcon?: string;
    decoratorText?: string;
    decoratorTextVars?: any;
    flipInput?: boolean;
    hideLabel?: boolean;
};

export interface iOutput {
    id: string;
    type: SOCKET_TYPE;
    execute: string;
    isList?: boolean;
    disabled?: boolean;
};