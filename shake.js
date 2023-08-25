const fs = require('fs');

/* TODO
 Map function imports to define imports
 Check the source for each of the imports
 Remove unused imports
*/

const printArrayOfStrings = function(inputArr) {
    for (let i = 0; i < inputArr.length; i++) {
        console.log(inputArr[i]);
    }
};

const readFile = function(fileName) {
    if (fileName === undefined) return false;
    if (fileName === null) return false;
    if (fileName.length === 0) return false;

    let encoding = { encoding: 'utf-8' };
    let outputString = '';
    outputString = fs.readFileSync(fileName, encoding, (err, data) => {
        if (err) throw err;
        return data.toString();
    });
    return outputString;
};


const getDefineImportsFromString = function (inputString) {
    let firstIndex = inputString.indexOf('[') + 1;
    let secondIndex = inputString.indexOf(']') - 1;
    let definesBetween = inputString.substring(firstIndex, secondIndex);
    let output = definesBetween.split(',');

    for (let i = 0; i < output.length; i++) {
        output[i] = output[i].replace(/ /g, "");
        output[i] = output[i].trim();
    }
    return output;
};


const getFunctionImportsFromString = function (inputString) {
    let firstIndex = inputString.indexOf('function') + 'function'.length;
    let secondIndex = inputString.indexOf(')');
    let definesBetween = inputString.substring(firstIndex, secondIndex);
    let firstOpenIndex = definesBetween.indexOf('(') + 1;
    let functionSignature = definesBetween.substring(firstOpenIndex, secondIndex);
    let output = functionSignature.split(',');

    for (let i = 0; i < output.length; i++) {
        output[i] = output[i].replace(/ /g, "");
        output[i] = output[i].trim();
    }

    return output;
};

const findIndexOfImportsNotUsedInSource = function(source, importArr) {
    let startIndex = source.indexOf(')') + 3;
    let sourceSubStr = source.substring(startIndex, source.length);
    sourceSubStr = sourceSubStr.trim();
    let notFoundImportArr = [];
    for (let i = 0; i < importArr.length; i++) {
        let currIndex = sourceSubStr.indexOf(importArr[i]);
        if (currIndex === -1) {
            notFoundImportArr.push(importArr[i]);
        }
    }
    return notFoundImportArr;
};

const mapFunctionImportsToDefineImports = function () {

};


let m = readFile('datum.js');
let a = getDefineImportsFromString(m);
let b = getFunctionImportsFromString(m);
let c = findIndexOfImportsNotUsedInSource(m, b);
printArrayOfStrings(c);


