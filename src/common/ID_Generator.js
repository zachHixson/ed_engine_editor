const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()-_=+[{]}|;:,<.>/?';

class ID_Generator_Class{
    constructor(){
        this.curStep = 0;
    }

    get ALPHABET(){
        return ALPHABET;
    }

    newID(){
        let id = this.idFromNum(this.curStep);
        this.curStep++;
        return id;
    }

    idFromNum(num){
        let charLength = this.getIDLength(num);
        let id = '';
        let remainder = num;

        for (let i = charLength; i > 0; i--){
            let pow = ALPHABET.length ** (i - 1);
            let curCharIdx = Math.floor(remainder / pow);

            id += ALPHABET.charAt(curCharIdx);
            remainder -= pow * curCharIdx;
        }

        return id;
    }

    numFromID(id){
        let num = 0;

        for (let i = 0; i < id.length; i++){
            let pow = ALPHABET.length ** (id.length - i - 1);
            let curCharIdx = ALPHABET.indexOf(id.charAt(i));
            num += curCharIdx * pow;
        }

        return num;
    }

    getIDLength(num){
        if (num <= 0){
            return 1;
        }
        else{
            return Math.floor(
                Math.log(num) /
                Math.log(ALPHABET.length)
            ) + 1;
        }
    }
}

let ID_Generator = new ID_Generator_Class();

export default ID_Generator;