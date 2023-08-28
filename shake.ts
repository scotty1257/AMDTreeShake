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

let printFinalOutput = function (finalOutput: string, numberOfLinesToPrint: number) : void {
    let finalOutputArr: string[] = finalOutput.split('\n');

    console.log('====================BEGIN FINAL OUTPUT AFTER REMOVING IMPORTS====================');
    for (let i = 0; i < numberOfLinesToPrint; i++) {
        console.log(i + " | " + finalOutputArr[i]);
    }
    console.log('====================END FINAL OUTPUT AFTER REMOVING IMPORTS====================');

}

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
    let output: string = fileText;
    if (importsToRemoveMap.functionImports.length !== importsToRemoveMap.definitionImports.length)
        return '';

    for (let i = 0; i < importsToRemoveMap.definitionImports.length; i++) {
        let lenImportPath: number = importsToRemoveMap.definitionImports[i].length;

        let indexPath: number = fileText.indexOf(importsToRemoveMap.definitionImports[i]);
        let indexFunc: number = fileText.indexOf(importsToRemoveMap.functionImports[i]);
        let path: string = importsToRemoveMap.definitionImports[i];
        let func: string = importsToRemoveMap.functionImports[i];

        let funcRemove: string = determineCommaPlacementInFunc(fileText, indexFunc, func);
        let defRemove: string = determineCommaPlacementInDef(fileText, indexPath, path);
        // Need to handle the case of each import on a new line, and some imports on a single line
        // currently only handles the multi line import
        if (path && func) {
            output = output.replace(defRemove, '');
            output = output.replace(funcRemove, '');
            isFileCleaned = true;
        }
    }
    return output;
}

const replaceFuntionArgumentsWithUsedList = function(fileText: string, importsToRemoveMap: FuncDefImportMap) : string {

}

const determineCommaPlacementInDef = function (fileText: string, indexPath: number, pathIn: string) : string {

    let pathUndef: boolean = (pathIn === undefined || pathIn === null || pathIn.length === 0);

    let path: string = pathIn;

    if (pathUndef) {
        return '';
    } else {
        // Comma after filepath
        if (fileText[(indexPath + path.length)] === ',') { path += ','; }

        if (fileText[(indexPath + path.length + 1)] === ' ') { path += ' ,'; }

        // Comma before file path
        if (fileText[(indexPath - 1)] === ',') { path = ',' + path; }

        if (fileText[(indexPath - 2)] === ',') { path = ', ' + path;}
        console.log("PATH STRING::::>>> " + path);
    }

    if (path.length) return path;

    return '';
}

const determineCommaPlacementInFunc = function (fileText: string, indexFunc: number, funcIn: string) : string {

    let funcUndef: boolean = (funcIn === undefined || funcIn === null || funcIn.length === 0);

    let func: string = funcIn;

    if (funcUndef) {
        return '';
    } else {
        if (fileText[(indexFunc + func.length + 1)] === ',') { func += ','; }

        if (fileText[(indexFunc + func.length + 2)] === ',') { func += ' ,'; }

        // Comma before function arg
        if (fileText[(indexFunc - 1)] === ',') { func = ',' + func; }

        if (fileText[(indexFunc - 2)] === ',') { func = ', ' + func; }
        console.log("FUNC STRING::::>>> " + func);
    }

    if (func.length) return func;

    return '';

}

const processFile = function (fileName: string, directory?: string): void {
    // Read the entire file
    let fileContents: string = readFile(fileName);
    // Get the paths in the define section
    let defineImports: string[] = getDefineImportsFromString(fileContents);
    // get the function arguments that correspond to the paths
    let funcImports: string[] = getFunctionImportsFromString(fileContents);
    // Determine in the function arguments are not used in the file
    let importsNotUsed: string[] = findImportsNotUsedInSource(fileContents, funcImports);
    // Map any function imports to their corresponding path in the definition section
    let importsMap: FuncDefImportMap = mapImportsIfNotUsed(defineImports, importsNotUsed);
    // remove the mapped values in the text file
    let finalOutput: string = removeUnusedImports(fileContents, importsMap);
    // Print output after cleaning
    printFinalOutput(finalOutput, 20);
};


const isDefineInComment = function (textInput: string) : boolean {
    let isInComment: boolean = false;

    if (textInput.length === 0 || textInput === 'undefined' || textInput === null) {
        return isInComment;
    }

    return isInComment;
}
function doRun(fileToProcess: number) {
    const start = performance.now();
    for (let i = 0; i < fileToProcess; i++) {
        processFile('SWXWebMBDWAfr.js')
    }
    const end = performance.now();
    console.log("Done in: " + (end - start) / 1000 + " sec");
}

let numberFiles: number = 1;
doRun(numberFiles);