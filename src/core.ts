//@ts-nocheck
export { HTMLTemplate, EngineRawText } from '@compiled/Engine';

//set core directory for both dev and build

//#ifdef IS_DEV
    export { Engine } from '@engine/Engine';
    import * as Core from '@engine/core/core';
//#endif IS_DEV

//#ifdef IS_BUILD
    import {Core} from '@compiled/Engine';
    export { Engine } from '@compiled/Engine';
//#endif IS_BUILD

export default Core;