import icon_event from '@/assets/event.svg';
import icon_flow from '@/assets/flow.svg';
import icon_object from '@/assets/object_icon.svg';
import icon_movement from '@/assets/direction_arrows.svg';
import icon_variable from '@/assets/variable_icon.svg';

const categoryStyleMap = new Map<string, {name: string, color: string, icon: string}>();

function addStyle (name: string, color: string, icon: string): void {
    categoryStyleMap.set(name, {name, color, icon});
}

addStyle('events', '#ff968f', icon_event);
addStyle('flow', '#d0f051', icon_flow);
addStyle('object', '#89f592', icon_object);
addStyle('movement', '#4fe3ca', icon_movement);
addStyle('variables', '#bfbaff', icon_variable);

export default categoryStyleMap;