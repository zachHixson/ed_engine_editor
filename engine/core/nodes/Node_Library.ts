import { iNodeTemplate } from './iNodeTemplate';
import { iEditorNode, iEngineNode } from '../LogicInterfaces';

import Cat_Events from './Cat_Events';
import Cat_Flow from './Cat_Flow';
import Cat_Object from './Cat_Object';
import Cat_Movement from './Cat_Movement';
import Cat_Variables from './Cat_Variables';

export type GenericNode = iEditorNode | iEngineNode;

export const NodeList: iNodeTemplate[] = [
    ...Cat_Events,
    ...Cat_Flow,
    ...Cat_Object,
    ...Cat_Movement,
    ...Cat_Variables,
];

export const NodeMap = new Map<string, iNodeTemplate>();

NodeList.forEach(node => {
    NodeMap.set(node.id, node);
});

export function isEngineNode(node: any): node is iEngineNode {
    return !!node.engine;
}