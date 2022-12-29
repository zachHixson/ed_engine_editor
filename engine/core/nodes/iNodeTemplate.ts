import { iAnyObj } from "../interfaces";
import { SOCKET_TYPE, WIDGET } from "./Node_Enums";
import { iNodeLifecycleEvents } from "../LogicInterfaces";

export interface iNodeTemplate extends iNodeLifecycleEvents {
    id: string;
    category: string;
    isEvent?: boolean;
    inTriggers?: Array<iInTrigger>;
    outTriggers?: Array<string>;
    inputs?: Array<iInput>;
    widget?: {
        id: string;
        type: WIDGET;
        options?: iAnyObj | any[];
    };
    outputs?: Array<iOutput>;
    execute?(data: any): void;
    methods?: iAnyObj;

    [key: string]: any;
}

export interface iInTrigger {
    id: string;
    execute: string;
};

export interface iInput {
    id: string;
    type: SOCKET_TYPE;
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
    disabled?: boolean;
};