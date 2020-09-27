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

    static drawPixelData(canvas, spriteArray){
        const SPRITE_DIM = Util_2D.getSpriteDimensions(spriteArray);

        let ctx = canvas.getContext('2d');
        let imgData = ctx.createImageData(SPRITE_DIM, SPRITE_DIM);
        
        for (let i = 0; i < spriteArray.length; i++){
            let curIdx = i * 4;
            let rgb = this.HexToRGB(spriteArray[i]);

            imgData.data[curIdx + 0] = rgb.r;
            imgData.data[curIdx + 1] = rgb.g;
            imgData.data[curIdx + 2] = rgb.b;
            imgData.data[curIdx + 3] = (spriteArray[i].length > 0) ? 255 : 0;
        }

        ctx.putImageData(imgData, 0, 0);
    }

    static HexToRGB(hexStr){
        if (hexStr.charAt(0) == '#'){
            hexStr = hexStr.substring(1);
        }

        return {
            r: parseInt(hexStr.substring(0, 2), 16),
            g: parseInt(hexStr.substring(2, 4), 16),
            b: parseInt(hexStr.substring(4, 6), 16),
        }
    }
}

export default Draw_2D;