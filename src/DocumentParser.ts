import * as path from 'path';
import * as vscode from 'vscode';
import { Settings } from './Settings';
import { AstResult, FileMatch } from './types';
import { FileSystemHelper } from './FileSystemHelper';

export class DocumentParser {

    parserSettings = {
        parser: {
            locations: true,
            extractDoc: true,
            suppressErrors: true
        },
        ast: {
            withPositions: true
        },
        lexer: {
            short_tags: true
        }
    };

    public async process(document: vscode.TextDocument): Promise<{ [key: string]: FileMatch; }> {

        let processFiles: { [key: string]: FileMatch } = {};

        // parsing document
        let astObj = this.parse(document);

        if(astObj) {
            let astResults: AstResult[] = [];

            astResults.push(...this.findString(astObj));
            astResults.push(...this.findDoc(astObj));

            // map AstResult to FileMatch
            for (let [i,astResult] of Object.entries(astResults)) {
                if(astResult.value in processFiles) {
                    processFiles[astResult.value].ranges.push(astResult.range);
                } else {
                    processFiles[astResult.value] = {
                        value: astResult.value,
                        ranges: [astResult.range],
                        files: [],
                        filename: FileSystemHelper.getFileName(astResult.value)
                    };
                }
                if(astResult.workingDir) {
                    let fpath = path.resolve(path.parse(document.fileName).dir+path.sep,...astResult.value.replace(/\\/g, '/').split(path.posix.sep));
                    if(await FileSystemHelper.fileExists(fpath)) processFiles[astResult.value].files.push(fpath);
                }
            }
        }
        
        return processFiles;
    }

    public parse(document: vscode.TextDocument): object | false {
        
        let engine = require('php-parser');
        let parser = new engine(this.parserSettings);
        let parsedFile;

        try {
            parsedFile = parser.parseCode(document.getText());
        } catch (error) {
            console.log('Parsing error!');
            return false;
        }

        if('children' in parsedFile) return parsedFile.children;
        else return false;
    }

    isObject = (node: any) => typeof node === 'object' && node !== null;
    checkKind = (node: any, kind: string) => 'kind' in node && node.kind === kind;

    checkExt = (val: string) => {
        let extensionExists = false;
        Settings.supportedExtensions().forEach((ext) => {
            if(val.length > ext.length+1) {
                let substring = val.substr(val.length - ext.length-1);
                if(substring.indexOf('.'+ext) !== -1) extensionExists = true;
            }
        });
        return extensionExists;
    };

    public findString(currNode: any, keys: string[] = [], output: AstResult[] = [], mainNode: any = currNode) {
        let parentKey = keys;
        if(this.isObject(currNode)) {
            Object.keys(currNode).forEach((key) => {
                if(this.isObject(currNode[key])) {
                    if(this.checkKind(currNode[key], 'string')) {
                        if(this.checkExt(currNode[key].value)) {
                            let workingDir = false;
                            let parentNode = parentKey.reduce((o,i)=>o[i], mainNode);
                            if(this.isObject(parentNode) && this.checkKind(parentNode, 'bin')) {
                                if('left' in parentNode) {
                                    if(this.checkKind(parentNode.left, 'magic') && parentNode.left.value === '__DIR__') {
                                        workingDir = true;
                                    } else if (this.checkKind(parentNode.left, 'call') && parentNode.left.what.name === 'dirname') {
                                        if(parentNode.left.arguments.length>0 && parentNode.left.arguments[0].value === '__FILE__') workingDir = true;
                                    }
                                }
                            }
                            let range = new vscode.Range(
                                new vscode.Position(currNode[key].loc.start.line-1, currNode[key].loc.start.column+1), 
                                new vscode.Position(currNode[key].loc.end.line-1, currNode[key].loc.end.column-1)
                            );

                            output.push({
                                value: currNode[key].value,
                                astPath: keys.concat(key),
                                range: range,
                                workingDir: workingDir
                            });
                        }
                    } else {
                        output.concat(this.findString(currNode[key], keys.concat(key), output, mainNode));
                    }
                }
            });
        }
        return output;
    };

    public findDoc(currNode: any, keys: string[] = [], output: AstResult[] = [], mainNode: any = currNode) {
        if(this.isObject(currNode)) {
            Object.keys(currNode).forEach((key) => {
                if(this.isObject(currNode[key])) {
                    if(this.checkKind(currNode[key], 'commentblock')) {
                        const lines = currNode[key].value.split(/\r?\n/).filter((element: string) => element);
                        let match, startLine = currNode[key].loc.start.line;
                        let docRegex = new RegExp(String.raw`(([a-zA-Z0-9\/\\_.-]*)\.(${Settings.supportedExtensions().join('|')}))`,'gm');

                        for(var i = 0; i < lines.length; i++) {
                            while (match = docRegex.exec(lines[i])) {
                                if(this.checkExt(match[0])) {
                                    output.push({
                                        value: match[0],
                                        astPath: keys.concat(key),
                                        range: new vscode.Range(
                                            new vscode.Position(startLine+i-1, match.index), 
                                            new vscode.Position(startLine+i-1, match.index+match[0].length)
                                        ),
                                        workingDir: false
                                    });
                                }
                            }
                        }
                    } else {
                        output.concat(this.findDoc(currNode[key], keys.concat(key), output, mainNode));
                    }
                }
            });
        }
        return output;
    };

}