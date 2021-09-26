export const NODE_LIST = [
    {
        id: 'basic_test_1',
        category: 'basic',
    },
    {
        id: 'basic_test_2',
        category: 'basic',
    },
    {
        id: 'movement_test_1',
        category: 'movement',
    },
    {
        id: 'movement_test_2',
        category: 'movement',
    },
    {
        id: 'control_test_1',
        category: 'control',
    },
    {
        id: 'control_test_2',
        category: 'control',
    },
];

export const NODE_MAP = new Map();

NODE_LIST.forEach(node => {
    NODE_MAP.set(node.id, node);
});