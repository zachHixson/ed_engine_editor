const state = {
    sprites: []
};

const getters = {
    serialize: () => {
        return {
            sprites
        }
    },
    getRandomSprite: () => {
        let tempData = [];

        for (let i = 0; i < 16 * 16; i++) {
            let hexAlph = "0123456789ABCDEF";
            let curHex = '#';
            for (let i = 0; i < 6; i++) {
                curHex += (hexAlph.charAt(Math.floor(Math.random() * hexAlph.length)));
            }

            if (Math.random() > 0.5){
                tempData.push(curHex);
            }
            else{
                tempData.push('');
            }
        }

        tempData[0] = "#FF0000";
        tempData[1] = "#00FF00";
        tempData[2] = "#0000FF";

        return tempData;
    },
    getEmptySprite: () => {return new Array(16 * 16).fill('')}
};

const actions = {
    test: ({ commit }) => {
        console.log("works");
    }
};

const mutations = {

};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}