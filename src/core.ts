//@ts-expect-error
export { HTMLTemplate, EngineRawText } from '@compiled/Engine';

//set core directory for both dev and build

//#ifdef IS_DEV
    //@ts-expect-error
    export { Engine } from '@engine/Engine';
    //@ts-expect-error
    import * as Core from '@engine/core/core';
//#endif IS_DEV

//#ifdef IS_BUILD
    //@ts-expect-error
    import {Core} from '@compiled/Engine';
    //@ts-expect-error
    export { Engine } from '@compiled/Engine';
//#endif IS_BUILD

export default Core;