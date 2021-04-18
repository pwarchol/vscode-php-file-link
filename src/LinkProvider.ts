import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class LinkProvider implements vscode.DocumentLinkProvider {

    public async provideDocumentLinks(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.DocumentLink[]> {
        let results: vscode.DocumentLink[] = [];

        var currentDirectory = path.parse(document.fileName).dir;

        for (let i = 0; i < document.lineCount; i++) {
            let line = document.lineAt(i);

            let result = await this.getLinksOnLine(line,currentDirectory);

            if (result.length > 0) {
                results.push(...result);
            }
        }

        return Promise.resolve(results);
    }

    public async getLinksOnLine(line: vscode.TextLine, currentDirectory: string) {
        const results: vscode.DocumentLink[] = [];

        let searchExt: Array<String> | undefined;
        searchExt = vscode.workspace.getConfiguration().get('phpFileLink.supportedExtensions');
        if(searchExt === undefined || !Array.isArray(searchExt) || searchExt.length === 0) {
            searchExt = ["php"];
        }

        let quotesRegex = /(?=["'])(?:"[^"\\]*(?:\\[\s\S][^"\\]*)*"|'[^'\\]*(?:\\[\s\S][^'\\]*)*')/g;
        let extRegex = new RegExp(String.raw`^.*\.(${searchExt.join('|')})$`,'g');

        let match;
        while((match = quotesRegex.exec(line.text)) !== null) {
            let rawLength = match[0].length;
            let quoteType = match[0].charAt(0);
            let backslashRegex = new RegExp(String.raw`\\${quoteType}`, 'g');
            let rawPath = match[0].slice(1,-1).replace(backslashRegex, quoteType);

            if(extRegex.test(rawPath)) {
                let start = match.index + 1;
                let end = match.index + rawLength;

                let filePath = await this.getFullPath(currentDirectory, rawPath);

                if(filePath) {
                    results.push(new vscode.DocumentLink(
                        new vscode.Range(
                            new vscode.Position(line.lineNumber, start), 
                            new vscode.Position(line.lineNumber, end)
                        ), 
                        vscode.Uri.file(filePath)
                    ));
                }
            
            }
        }

        return results;
    }

    private async getFullPath(currentDirectory: string, value: string): Promise<string|false> {
        var splitted = value.split(path.sep); 
        let fpath = path.resolve(currentDirectory+path.sep,...splitted);
        if (await this.fileExists(fpath)) {
            return fpath;
        } else {
            return false;
        }
    }

    private async fileExists(_path: string): Promise<boolean> {
        try {
            fs.accessSync(_path);
            let stat = fs.lstatSync(_path);
            return stat.isFile();
        } catch (error) {
            return false;
        }
    }


}