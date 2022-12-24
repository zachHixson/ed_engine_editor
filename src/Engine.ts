import {loadShared} from '@compiled/Shared';

declare global {
    interface Window {
        _sharedLibraryObject: any;
    }
}

window._sharedLibraryObject = loadShared();

export default window._sharedLibraryObject as {[key: string | number | symbol]: any};

export const Victor = {} as any;
export const Engine = {} as any;