//@ts-ignore
export { HTMLTemplate, EngineRawText } from '@compiled/Engine';

//set core directory for both dev and build

//#ifdef IS_DEV
    //@ts-ignore
    export { Engine } from '@engine/Engine';
    //@ts-ignore
    import * as Core from '@engine/core/core';
//#endif IS_DEV

//#ifdef IS_BUILD
    //@ts-ignore
    import {Core} from '@compiled/Engine';
    //@ts-ignore
    export { Engine } from '@compiled/Engine';
//#endif IS_BUILD

export default Core;