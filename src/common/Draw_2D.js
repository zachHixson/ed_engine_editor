import Util_2D from './Util_2D';

class Draw_2D{
    static drawCheckerBG(canvas, checkerSize, lightCol = '#AAA', darkCol = '#CCC'){
        let ctx = canvas.getContext('2d');
        let xCount = Math.ceil(canvas.width / checkerSize);
        let yCount = Math.ceil(canvas.height / checkerSize);

        if (xCount % 2 == 0){
            xCount += 1;
        }

        for (let x = 0; x < xCount; x++){
            for (let y = 0; y < yCount; y++){
                let curIdx = Util_2D.get2DIdx(x, y, xCount);

                ctx.fillStyle = (curIdx % 2) ? lightCol : darkCol;
                ctx.fillRect(
                    x * checkerSize,
                    y * checkerSize,
                    checkerSize,
                    checkerSize
                );
            }
        }
    }

    static drawPixelData(canvas, canvasWidth, spriteArray){
        const SPRITE_DIM = Util_2D.getSpriteDimensions(spriteArray);
        const PIXEL_WIDTH = Math.floor(canvasWidth / SPRITE_DIM);

        let ctx = canvas.getContext('2d');

        for (let x = 0; x < SPRITE_DIM; x++){
            for (let y = 0; y < SPRITE_DIM; y++){
                let curPixel = spriteArray[Util_2D.get2DIdx(x, y, SPRITE_DIM)];

                if (spriteArray[Util_2D.get2DIdx(x, y, SPRITE_DIM)] == null){
                    console.error(spriteArray[Util_2D.get2DIdx(x, y, SPRITE_DIM)]);
                    console.error(spriteArray);
                    console.error(Util_2D.get2DIdx(x, y, SPRITE_DIM));
                    console.error(x + " | " + y);
                }

                if (curPixel.length > 0){
                    ctx.fillStyle = curPixel;
                    ctx.fillRect(
                        (x * PIXEL_WIDTH),
                        (y * PIXEL_WIDTH),
                        Math.ceil(PIXEL_WIDTH),
                        Math.ceil(PIXEL_WIDTH)
                    );
                }
            }
        }
    }
}

export default Draw_2D;