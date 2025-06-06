const fs = require('fs');
const outputPath = './dist/';
const fileList = [
    './src/public/en_node_doc.json',
];

for (let i = 0; i < fileList.length; i++){
    const src = fileList[i];
    const fileContents = fs.readFileSync(src, {encoding: 'utf-8'});
    const splitPath = src.split('/');
    const fileName = splitPath[splitPath.length - 1];
    fs.writeFileSync(outputPath + fileName, fileContents);
}