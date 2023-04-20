import type Core from '@/core';

export type GenericSocket = {id: string, value: any};
export type ActionMap = Map<Core.LOGIC_ACTION, (data?: any | object, commit?: boolean)=>void>;