import * as path from 'path';
import * as vscode from 'vscode';
import { Settings } from './Settings';
import { FileMatch, MyLink } from './types';
import { DocumentParser } from './DocumentParser';
import { FileSystemHelper } from './FileSystemHelper';

export class LinkProvider implements vscode.DocumentLinkProvider {

    fsHelper: FileSystemHelper;

    constructor(fsHelper: FileSystemHelper) {
        this.fsHelper = fsHelper;
    }

    public async provideDocumentLinks(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<MyLink[]|undefined> {

        let results: MyLink[] = [];
        let processFiles: { [key: string]: FileMatch } = {};

        let currentWorskpaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if(currentWorskpaceFolder) {

            let parser = new DocumentParser();
            if(processFiles = await parser.process(document)) {
                if(token.isCancellationRequested) return;

                // Get current workspace files
                let foundPaths: string[] = await this.fsHelper.getWsFiles(currentWorskpaceFolder, token);
                if(token.isCancellationRequested) return;

                // Assign files to processFiles base on filename
                for (let [key, fileMatch] of Object.entries(processFiles)) {
                    let match = foundPaths.filter(filePath => FileSystemHelper.getFileName(filePath) === fileMatch.filename);
                    if(fileMatch.files.length===0) fileMatch.files = Array.from(new Set(fileMatch.files.concat(match)));
                }

                // Creating DocumentLinks
                for (let [key, fileMatch] of Object.entries(processFiles)) {
                    let links = this.getDocumentLinks(fileMatch, document);
                    if (links.length > 0) results.push(...links);
                }

            }
        }

        return results;
    }

    public async resolveDocumentLink(link: MyLink, token: vscode.CancellationToken): Promise<MyLink|undefined> {

        if(link.fileMatch.files.length>0) {
            let splitted = FileSystemHelper.userPathSplit(link.fileMatch.value);
            let label = path.join(...splitted);

            let currentWorskpaceFolder = vscode.workspace.getWorkspaceFolder(link.document.uri);

            let pickList = link.fileMatch.files.map((f) => {
                return {
                    label: label,
                    description: currentWorskpaceFolder ? f.replace(currentWorskpaceFolder.uri.fsPath,'') : f,
                    path: f
                };
            });

            vscode.window.showQuickPick(pickList, { matchOnDescription: true }).then(selected => {
                if(selected) {
                    vscode.commands.executeCommand('vscode.open', vscode.Uri.file(selected.path));
                }
            });
        } else {
            vscode.window.showWarningMessage('File '+link.fileMatch.filename+' does not exist in this workspace.');
        }

        throw 'Throwing on purpose to avoid default infobox.';
    }

    public getDocumentLinks(fileMatch: FileMatch, document: vscode.TextDocument) {
        const results: MyLink[] = [];
        let filePath: string | undefined | true;

        if(fileMatch.files.length>=1) {

            var splitted = FileSystemHelper.userPathSplit(fileMatch.value).reverse();
            let results: number[] = [];

            for (let i = 0; i < fileMatch.files.length; i++) {
                let tmp = fileMatch.files[i].split(path.sep).reverse();
                for (let f = 0; f < tmp.length; f++) {
                    if(splitted[f] && tmp[f]===splitted[f]) {
                        results[i] = results[i] ? results[i]+1 : 1;
                    }
                }
            }

            let max = Math.max.apply(Math, results);
            if(max>=splitted.length) {
                let count = results.filter((i) => i === max).length;
                if(count===1) filePath = fileMatch.files[results.indexOf(max)];
                else {
                    fileMatch.files = fileMatch.files.filter((file, i) => results[i]>=splitted.length);
                    filePath = true;
                }
            }

        }

        if(filePath || Settings.showLinksForFilesThatDoNotExist()) {
            let uri = filePath === true || !filePath ? undefined : vscode.Uri.file(filePath).with({ fragment: `L${fileMatch.line}` });
            fileMatch.ranges.forEach(range => {
                results.push(new MyLink(range, fileMatch, document, uri));
            });
        }

        return results;
    }

}