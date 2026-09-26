import { Sprite } from '../../engine/core/data_classes/Sprite';

function createNonXParentFrame(): ImageData {
    const clrArray = new Array<number>();

    for (let i = 0; i < 25; i++) {clrArray.push(24, 3, 0, 255)} //brownish
    for (let i = 0; i < 6; i++) {clrArray.push(0, 3, 24, 255)} //blueish

    clrArray.push(0, 4, 240, 255) //greenish
    clrArray.push(0, 0, 255, 255) //blue
    clrArray.push(0, 0, 255, 255) //blue
    clrArray.push(0, 0, 255, 255) //blue
    clrArray.push(0, 4, 240, 255) //greenish

    while ((clrArray.length / 4) < (256 - 7)) { // fill all but last 7 with almost black
        clrArray.push(1, 1, 1, 255);
    }

    //fill last 7 with white
    clrArray.push(
        ...(new Array(7 * 4).fill(255))
    );

    const u8 = new Uint8ClampedArray(clrArray);
    const imgData = new ImageData(u8, 16, 16);

    return imgData;
}

function createXParentFame(): ImageData {
    const nonXparentFrame = createNonXParentFrame();

    //create xparent run
    for (let i = 0; i < 11; i++) {
        const idx = (i + 154) * 4;
        nonXparentFrame.data[idx + 0] = 0;
        nonXparentFrame.data[idx + 1] = 0;
        nonXparentFrame.data[idx + 2] = 0;
        nonXparentFrame.data[idx + 3] = 0;
    }

    //create single xparent pixel
    const offset = 948;
    nonXparentFrame.data[offset + 0] = 0;
    nonXparentFrame.data[offset + 1] = 0;
    nonXparentFrame.data[offset + 2] = 0;
    nonXparentFrame.data[offset + 3] = 0;

    return nonXparentFrame;
}

function createUniqueFrame(): ImageData {
    const PIXEL_COUNT = 256;
    const clrArray = new Uint8ClampedArray(PIXEL_COUNT * 4);

    for (let i = 0; i < PIXEL_COUNT; i++) {
        const idx = i * 4;
        const r = (i % 50) + 100;
        const g = Math.floor(i / 50) + 100;
        const b = Math.floor(i / 100);
        clrArray[idx + 0] = r;
        clrArray[idx + 1] = g;
        clrArray[idx + 2] = b;
        clrArray[idx + 3] = 255;
    }

    return new ImageData(clrArray, 16, 16);
}

(()=>{
    const frameData = [
        createNonXParentFrame(),
        createXParentFame(),
        createUniqueFrame(),
        new ImageData(new Uint8ClampedArray(256 * 4), 16, 16),
    ];

    const sprite = new Sprite();

    sprite.setFramesFromArray(frameData);

    const compressed = Sprite.compressFrames(sprite.frames);
    const decompressed = Sprite.decompressFrames(compressed);

    let matches = true;

    for (let i = 0; i < frameData.length && matches; i++) {
        const originalFrame = frameData[i];
        const decompFrame = decompressed[i];

        for (let j = 0; j < originalFrame.data.length && matches; j++) {
            if (originalFrame.data[j] != decompFrame.data[j]) {
                matches = false;
            }
        }
    }

    if (!matches) {
        console.error("Does not match");
    }
})();
