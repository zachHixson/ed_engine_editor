import ID_Generator from '@/common/ID_Generator';

class Asset{
    constructor(){
        this.ID = ID_Generator.newID();
    }

    static get type(){return 'GENERIC'}
}

export default Asset;