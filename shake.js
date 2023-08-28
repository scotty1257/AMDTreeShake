"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//import {getFilesInDirectoryRecursive } from './readDirectory'
var fs = require("fs");
// @ts-ignore
var printImportMap = function (importMap) {
    for (var i = 0; i < importMap.definitionImports.length; i++) {
        console.log(i + ': ' + importMap.definitionImports[i] + ', ' + importMap.functionImports[i]);
    }
};
// @ts-ignore
var printArrayOfStrings = function (inputArr) {
    for (var i = 0; i < inputArr.length; i++) {
        console.log(inputArr[i]);
    }
};
var printFinalOutput = function (finalOutput, numberOfLinesToPrint) {
    var finalOutputArr = finalOutput.split('\n');
    console.log('====================BEGIN FINAL OUTPUT AFTER REMOVING IMPORTS====================');
    for (var i = 0; i < numberOfLinesToPrint; i++) {
        console.log(i + " | " + finalOutputArr[i]);
    }
    console.log('====================END FINAL OUTPUT AFTER REMOVING IMPORTS====================');
};
var readFile = function (fileName) {
    if (fileName === undefined)
        return '';
    if (fileName === null)
        return '';
    if (fileName.length === 0)
        return '';
    var options = { encoding: 'utf-8' };
    var output = '';
    output = fs.readFileSync(fileName, options).toString();
    return output;
};
var getDefineImportsFromString = function (input) {
    var firstIndex = input.indexOf('[') + 1;
    var secondIndex = input.indexOf(']') - 1;
    var definesBetween = input.substring(firstIndex, secondIndex);
    var output = definesBetween.split(',');
    for (var i = 0; i < output.length; i++) {
        output[i] = output[i].replace(/ /g, "");
        output[i] = output[i].trim();
    }
    return output;
};
var getFunctionImportsFromString = function (inputString) {
    var firstIndex = inputString.indexOf('function') + 'function'.length;
    var secondIndex = inputString.indexOf(')');
    var definesBetween = inputString.substring(firstIndex, secondIndex);
    var firstOpenIndex = definesBetween.indexOf('(') + 1;
    var functionSignature = definesBetween.substring(firstOpenIndex, secondIndex);
    var output = functionSignature.split(',');
    for (var i = 0; i < output.length; i++) {
        output[i] = output[i].replace(/ /g, "");
        output[i] = output[i].trim();
    }
    return output;
};
var findImportsNotUsedInSource = function (source, importArr) {
    var startIndex = source.indexOf(')') + 3;
    var sourceSubStr = source.substring(startIndex, source.length);
    sourceSubStr = sourceSubStr.trim();
    var notFoundImportArr = [];
    for (var i = 0; i < importArr.length; i++) {
        var currIndex = sourceSubStr.indexOf(importArr[i]);
        if (currIndex === -1) {
            notFoundImportArr.push(importArr[i]);
        }
    }
    return notFoundImportArr;
};
var mapImportsIfNotUsed = function (defImports, importsNotUsed) {
    var importNotUsedMap = {
        functionImports: [],
        definitionImports: []
    };
    /*
        Example:
        def(x/x/A, x/x/B, x/x/C, x/x/D)
        func(A, B, D)
        C is unused therefore add x/x/C to defImports
    */
    for (var i = 0; i < defImports.length; i++) { // x/x/A, x/x/B, x/x/C, x/x/D, x/x/E, x/x/F, x/x/G
        for (var k = 0; k < importsNotUsed.length; k++) { // C, F, G
            var defImport = defImports[i];
            var notUsed = importsNotUsed[k];
            if (defImport.indexOf(notUsed) !== -1) {
                importNotUsedMap.functionImports.push(notUsed);
                importNotUsedMap.definitionImports.push(defImport);
            }
        }
    }
    return importNotUsedMap;
};
var removeUnusedImports = function (fileText, importsToRemoveMap) {
    var isFileCleaned = false;
    var output = '';
    if (importsToRemoveMap.functionImports.length !== importsToRemoveMap.definitionImports.length)
        return '';
    for (var i = 0; i < importsToRemoveMap.definitionImports.length; i++) {
        var lenImportPath = importsToRemoveMap.definitionImports[i].length;
        var indexPath = fileText.indexOf(importsToRemoveMap.definitionImports[i]);
        var indexFunc = fileText.indexOf(importsToRemoveMap.functionImports[i]);
        var path = importsToRemoveMap.definitionImports[i];
        var func = importsToRemoveMap.functionImports[i];
        var funcRemove = determineCommaPlacementInFunc(fileText, indexFunc, func);
        var defRemove = determineCommaPlacementInDef(fileText, indexPath, path);
        // Need to handle the case of each import on a new line, and some imports on a single line
        // currently only handles the multi line import
        if (path && func) {
            output = fileText.replace(funcRemove, '');
            output = fileText.replace(defRemove, '');
            isFileCleaned = true;
        }
    }
    return output;
};
var determineCommaPlacementInDef = function (fileText, indexPath, pathIn) {
    var pathUndef = (pathIn === undefined || pathIn === null || pathIn.length === 0);
    var path = pathIn;
    if (pathUndef) {
        return '';
    }
    else {
        // Comma after filepath
        if (fileText[(indexPath + path.length)] === ',') {
            path += ',';
        }
        if (fileText[(indexPath + path.length + 1)] === ' ') {
            path += ' ,';
        }
        // Comma before file path
        if (fileText[(indexPath - 1)] === ',') {
            path = ',' + path;
        }
        if (fileText[(indexPath - 1)] === ' ') {
            path = ', ' + path;
        }
    }
    if (path.length)
        return path;
    return '';
};
var determineCommaPlacementInFunc = function (fileText, indexFunc, funcIn) {
    var funcUndef = (funcIn === undefined || funcIn === null || funcIn.length === 0);
    var func = funcIn;
    if (funcUndef) {
        return '';
    }
    else {
        if (fileText[(indexFunc + func.length)] === ',') {
            func += ',';
        }
        if (fileText[(indexFunc + func.length + 1)] === ' ') {
            func += ' ,';
        }
        // Comma before function arg
        if (fileText[(indexFunc - 1)] === ',') {
            func = ',' + func;
        }
        if (fileText[(indexFunc - 1)] === ' ') {
            func = ', ' + func;
        }
    }
    if (func.length)
        return func;
    return '';
};
var processFile = function (fileName, directory) {
    var fileContents = readFile(fileName);
    var defineImports = getDefineImportsFromString(fileContents);
    var funcImports = getFunctionImportsFromString(fileContents);
    var importsNotUsed = findImportsNotUsedInSource(fileContents, funcImports);
    var importsMap = mapImportsIfNotUsed(defineImports, importsNotUsed);
    var finalOutput = removeUnusedImports(fileContents, importsMap);
    printFinalOutput(finalOutput, 20);
};
var isDefineInComment = function (textInput) {
    var isInComment = false;
    if (textInput.length === 0 || textInput === 'undefined' || textInput === null) {
        return isInComment;
    }
    return isInComment;
};
processFile('SWXWebMBDWAfr.js');
