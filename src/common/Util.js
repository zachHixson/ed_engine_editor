class Util{
    static getHighestEndingNumber(list){
        let highest = -1;
        let pattern = /\d+$/

        for (let i = 0; i < list.length; i++){
            let number = parseInt(list[i].match(pattern));

            if (number != NaN && number > highest){
                highest = number;
            }
        }

        return highest;
    }
}

export default Util;