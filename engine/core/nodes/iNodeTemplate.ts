import { SOCKET_TYPE } from "./Node_Enums";
import { iEventContext, iTemplateLifecycle, iEditorNodeMethod, iEngineNodeMethod, iEngineNode } from "@engine/core/LogicInterfaces";
import { Widget, Widget_Template } from "./Widget";

export interface iNodeTemplate extends iTemplateLifecycle {
    id: string;
    category: string;
    isEvent?: boolean;
    doNotCopy?: boolean;
    reverseInputs?: boolean;
    reverseOutputs?: boolean;
    stackDataIO?: boolean;
    inputBoxWidth?: number;
    editorCanDelete?: boolean;
    showEditButton?: boolean;
    inTriggers?: Array<iInTrigger>;
    outTriggers?: Array<string>;
    inputs?: Array<iInput>;
    widget?: Widget_Template;
    outputs?: Array<iOutput>;
    execute?(eventContext: iEventContext, data: unknown): void;
    refresh?(): void;
}

export interface iInTrigger {
    id: string;
    execute: (this: iEngineNode, eventContext: iEventContext)=>unknown;
};

type GenerateDefaults<T extends SOCKET_TYPE, D> = { type: T } & (
{
    isList: true;
    optional?: never;
    default: D[] | null;
} |
{
    isList?: never;
    optional?: never;
    default: D;
} |
{
    isList?: never;
    optional: true;
    default: D | null;
});

type TypeDefaults<T> = T & (
    GenerateDefaults<SOCKET_TYPE.ANY | SOCKET_TYPE.ASSET | SOCKET_TYPE.INSTANCE, null> |
    GenerateDefaults<SOCKET_TYPE.NUMBER, number> |
    GenerateDefaults<SOCKET_TYPE.STRING, string> |
    GenerateDefaults<SOCKET_TYPE.BOOL, boolean> |
    GenerateDefaults<SOCKET_TYPE.TRIPLE, boolean | null>
);

export type iInput = TypeDefaults<{
    id: string;
    hideSocket?: boolean;
    disabled?: boolean;
    hideInput?: boolean;
    enableDecorators?: boolean;
    decoratorIcon?: string;
    decoratorText?: string;
    decoratorTextVars?: Record<string, unknown>;
    flipInput?: boolean;
    hideLabel?: boolean;
}>;

export interface iOutput {
    id: string;
    type: SOCKET_TYPE;
    execute: (this: iEngineNode, eventContext: iEventContext)=>unknown;
    isList?: boolean;
    disabled?: boolean;
};
