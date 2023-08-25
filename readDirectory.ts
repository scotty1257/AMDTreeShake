import fs = require('fs');
import path = require('path');


/*const readFile = function (fileName: string): string {
    if (fileName === undefined) return '';
    if (fileName === null) return '';
    if (fileName.length === 0) return '';

    let encoding: any = { encoding: 'utf-8' };
    let output: string = '';
    output = fs.readFileSync(fileName, encoding, (err: any, data: any) => {
        if (err) throw err;
        return data.toString();
    });
    return output;
};*/



export const getFilesInDirectoryRecursive = function (dirPath?: string, localPath?: string): void {

    let filePath: string = '';

    if (dirPath != undefined) {
        let exists = fs.existsSync(dirPath);

        if (!exists) return;
    }

    if (dirPath === undefined && localPath !== undefined) {
        filePath = path.join(__dirname, localPath);
    } else {
        filePath = dirPath;
    }

    if (dirPath == undefined && localPath == undefined) {
        filePath = path.join(__dirname);
    }

    if (dirPath === '') {
        filePath = path.join(__dirname);

    }

    const options: { }  = {
        recursive: true
    };

    const files = fs.readdirSync(filePath, options);

    for (let file of files) {
        if (isFileJS(file))
            console.log(file.toString());
        else
            continue;

    }
}

const isFileJS = function (fileName: string | Buffer) : boolean {
    let file: string = fileName.toString();
    if (path.extname(file) !== '.js')
        return false;
    return true;
}

getFilesInDirectoryRecursive('E:/git/r426-SWXWeb/web/src/SWXWebMBD/SWXWebMBDCommands.mweb/src', '');