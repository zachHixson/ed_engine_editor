import icon_event from '@/assets/event.svg';
import icon_movement from '@/assets/direction_arrows.svg';
import icon_variable from '@/assets/variable_icon.svg';

const categoryStyleMap = new Map<string, {name: string, color: string, icon: string}>();

function addStyle (name: string, color: string, icon: string): void {
    categoryStyleMap.set(name, {name, color, icon});
}

addStyle('events', '#ff968f', icon_event);
addStyle('testing', '#e8c26f', icon_event);
addStyle('actual', '#d0f051', icon_event);
addStyle('drawing', '#89f592', icon_event);
addStyle('movement', '#4fe3ca', icon_movement);
addStyle('variables', '#bfbaff', icon_variable);

export default categoryStyleMap;