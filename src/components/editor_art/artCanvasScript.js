class ArtCanvas{
    constructor(element){
        this.canvas = element;
    }

    setup(){
        this.update();
    }

    update(){
        let ctx = this.canvas.getContext("2d");

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

export default ArtCanvas;