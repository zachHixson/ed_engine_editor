import type { imEvent } from '../RoomEditWindow.vue';

export default class Tool_Base {
    mouseDown(mEvent: imEvent): void {}
    mouseUp(mEvent: imEvent): void {}
    mouseMove(mEvent: imEvent): void {}

    click(mEvent: imEvent): void {}
    doubleClick(mEvent: imEvent): void {}
}