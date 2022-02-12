Shared.Asset = class {
    constructor(){
        this.id = Shared.ID_Generator.newID();
        this.name = this.id;

        if (window.EDITOR){
            this.navState = this.defaultNavState;
        }
    }

    get category_ID(){return Shared.CATEGORY_ID.UNDEFINED}
    get thumbnailData(){return null}
    get defaultNavState(){return {
        offset: new Victor(0, 0),
        zoomFac: 1,
    }}

    parseNavData(navData){
        return {
            offset: new Victor.fromObject(navData.offset),
            zoomFac: navData.zoomFac
        }
    }
    
    toSaveData(){return this}

    fromSaveData(data){
        Object.assign(this, data);
        this.navState = this.parseNavData(data.navState);
        return this;
    }

    purgeMissingReferences(){}
};