//import {getFilesInDirectoryRecursive } from './readDirectory'
import fs = require('fs');

interface FuncDefImportMap {
    functionImports: string[];
    definitionImports: string[];
}

// @ts-ignore
let printImportMap = function (importMap: FuncDefImportMap): void {
    for (let i = 0; i < importMap.definitionImports.length; i++) {
        console.log(i + ': ' + importMap.definitionImports[i] + ', ' + importMap.functionImports[i]);
    }
}

// @ts-ignore
let printArrayOfStrings = function (inputArr: string[]): void {
    for (let i: number = 0; i < inputArr.length; i++) {
        console.log(inputArr[i]);
    }
};

const readFile = function (fileName: string): string {
    if (fileName === undefined) return '';
    if (fileName === null) return '';
    if (fileName.length === 0) return '';

    let options: any = { encoding: 'utf-8' };
    let output: string = '';
    output = fs.readFileSync(fileName, options).toString();
    return output;
};


const getDefineImportsFromString = function (input: string): string[] {
    let firstIndex: number = input.indexOf('[') + 1;
    let secondIndex: number = input.indexOf(']') - 1;
    let definesBetween: string = input.substring(firstIndex, secondIndex);
    let output: string[] = definesBetween.split(',');

    for (let i: number = 0; i < output.length; i++) {
        output[i] = output[i].replace(/ /g, "");
        output[i] = output[i].trim();
    }
    return output;
};


const getFunctionImportsFromString = function (inputString: string): string[] {
    let firstIndex: number = inputString.indexOf('function') + 'function'.length;
    let secondIndex: number = inputString.indexOf(')');
    let definesBetween: string = inputString.substring(firstIndex, secondIndex);
    let firstOpenIndex: number = definesBetween.indexOf('(') + 1;
    let functionSignature: string = definesBetween.substring(firstOpenIndex, secondIndex);
    let output = functionSignature.split(',');

    for (let i = 0; i < output.length; i++) {
        output[i] = output[i].replace(/ /g, "");
        output[i] = output[i].trim();
    }

    return output;
};

const findImportsNotUsedInSource = function (source: string, importArr: string[]): string[] {
    let startIndex: number = source.indexOf(')') + 3;
    let sourceSubStr: string = source.substring(startIndex, source.length);
    sourceSubStr = sourceSubStr.trim();
    let notFoundImportArr: string[] = [];
    for (let i = 0; i < importArr.length; i++) {
        let currIndex: number = sourceSubStr.indexOf(importArr[i]);
        if (currIndex === -1) {
            notFoundImportArr.push(importArr[i]);
        }
    }
    return notFoundImportArr;
};

const mapImportsIfNotUsed = function (defImports: string[], importsNotUsed: string[]): FuncDefImportMap {
    let importNotUsedMap: FuncDefImportMap = {
        functionImports: [],
        definitionImports: []
    };

    /* 
        Example:
        def(x/x/A, x/x/B, x/x/C, x/x/D)
        func(A, B, D)
        C is unused therefore add x/x/C to defImports
    */

    for (let i: number = 0; i < defImports.length; i++) { // x/x/A, x/x/B, x/x/C, x/x/D, x/x/E, x/x/F, x/x/G
        for (let k: number = 0; k < importsNotUsed.length; k++) { // C, F, G
            let defImport: string = defImports[i];
            let notUsed: string = importsNotUsed[k];

            if (defImport.indexOf(notUsed) !== -1) {
                importNotUsedMap.functionImports.push(notUsed);
                importNotUsedMap.definitionImports.push(defImport);
            }
        }
    }

    return importNotUsedMap;
};

const removeUnusedImports = function (fileText: string, importsToRemoveMap: FuncDefImportMap): string {
    let isFileCleaned: boolean = false;
    let output: string = '';
    if (importsToRemoveMap.functionImports.length !== importsToRemoveMap.definitionImports.length)
        return '';

    for (let i = 0; i < importsToRemoveMap.definitionImports.length; i++) {
        let lenImportPath: number = importsToRemoveMap.definitionImports[i].length;

        let indexPath: number = fileText.indexOf(importsToRemoveMap.definitionImports[i]);
        let indexFunc: number = fileText.indexOf(importsToRemoveMap.functionImports[i]);
        let path: string = importsToRemoveMap.definitionImports[i];
        let func: string = importsToRemoveMap.functionImports[i];

        // Comma After file path
        if (fileText[(indexPath + path.length)] === ',') { path += ','; }

        if (fileText[(indexPath + path.length + 1)] === ' ,') { path += ' ,'; }

        // Comma before file path
        if (fileText[(indexPath - 1)] === ',') { path = ',' + path; }

        if (fileText[(indexPath - 1)] === ', ') { path = ', ' + path; }

        // Need to handle the case of each import on a new line, and some imports on a single line
        // currently only handles the multi line import
        if (path && func) {
            output = fileText.replace(path, '');
            isFileCleaned = true;
        }
    }
    return output;
}

const processFile = function (fileName: string, directory?: string): void {
    let m = readFile(fileName); //  Add directory to new function soon
    //console.log(m);
    let a = getDefineImportsFromString(m);
    let b = getFunctionImportsFromString(m);
    let c = findImportsNotUsedInSource(m, b);
    let k = mapImportsIfNotUsed(a, c);
    let j = removeUnusedImports(m, k)
    console.log(j);
    //printImportMap(k);

    //printArrayOfStrings(c);
};

processFile('drwannline.js')


