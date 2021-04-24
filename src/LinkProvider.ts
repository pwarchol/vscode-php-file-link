import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export interface FileMatch {
    value: string;
    ranges: vscode.Range[];
    files: string[];
    filename: string;
}

export class LinkProvider implements vscode.DocumentLinkProvider {

    public async provideDocumentLinks(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.DocumentLink[]> {

        let results: vscode.DocumentLink[] = [];
        let processFiles: { [key: string]: FileMatch } = {};

        let mode: string = vscode.workspace.getConfiguration().get('phpFileLink.linkMode') || 'scan_workspace';

        let currentWorskpaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if(currentWorskpaceFolder) {

            // Scan lines
            for (let i = 0; i < document.lineCount; i++) {
                processFiles = this.scanLine(document.lineAt(i), processFiles);
            }

            switch (mode) {
                case 'active_document':

                    // Resolve paths
                    for (let [key, fileMatch] of Object.entries(processFiles)) {
                        let fpath = path.resolve(path.parse(document.fileName).dir+path.sep,...fileMatch.value.split('/'));
                        if(this.fileExists(fpath)) fileMatch.files.push(fpath);
                    }

                    break;

                case 'scan_workspace':

                    // Find matching files
                    let fileNames = Object.keys(processFiles).map(val => processFiles[val].filename);
                    let foundPaths = this.walkSync(currentWorskpaceFolder.uri.fsPath, Array.from(new Set(fileNames)));

                    // Assign files to processFiles
                    for (let [key, fileMatch] of Object.entries(processFiles)) {
                        let match = foundPaths.filter(filePath => path.basename(filePath) === fileMatch.filename);
                        fileMatch.files = Array.from(new Set(fileMatch.files.concat(match)));
                    }
                    break;
            }

            // Creating DocumentLink's
            for (let [key, fileMatch] of Object.entries(processFiles)) {
                let links = this.getDocumentLinks(fileMatch, document);
                if (links.length > 0) results.push(...links);
            }

            return results;
        }

        return [];
    }

    public scanLine(line: vscode.TextLine, results: { [key: string]: FileMatch } = {}) {

        let searchExt: string[] = vscode.workspace.getConfiguration().get('phpFileLink.supportedExtensions') || ['php','ini','log'];

        let quotesRegex = /(?=["'])(?:"[^"\\]*(?:\\[\s\S][^"\\]*)*"|'[^'\\]*(?:\\[\s\S][^'\\]*)*')/g;
        let extRegex = new RegExp(String.raw`^.*\.(${searchExt.join('|')})$`,'g');

        let match;
        while((match = quotesRegex.exec(line.text)) !== null) {
            let rawLength = match[0].length;
            let quoteType = match[0].charAt(0);
            let backslashRegex = new RegExp(String.raw`\\${quoteType}`, 'g');
            let value = match[0].slice(1,-1).replace(backslashRegex, quoteType);

            if(extRegex.test(value)) {
                let start = match.index + 1;
                let end = match.index + rawLength;

                let range = new vscode.Range(
                    new vscode.Position(line.lineNumber, start), 
                    new vscode.Position(line.lineNumber, end)
                );

                if(value in results) {
                    results[value].ranges.push(range);
                } else {
                    results[value] = {
                        value: value,
                        ranges: [range],
                        files: [],
                        filename: path.basename(value)
                    };
                }
            }
        }

        return results;
    }

    public getDocumentLinks(fileMatch: FileMatch, document: vscode.TextDocument) {
        const results: vscode.DocumentLink[] = [];
        let filePath: string | undefined;

        if(fileMatch.files.length===1) {
            filePath = fileMatch.files[0];
        } else if(fileMatch.files.length>1) {

            var splitted = path.normalize(fileMatch.value).split('/').filter(obj => !['.','..',''].includes(obj)).reverse();
            let results: number[] = [];

            for (let i = 0; i < fileMatch.files.length; i++) {
                let tmp = fileMatch.files[i].split('/').reverse();
                for (let f = 0; f < tmp.length; f++) {
                    if(splitted[f] !== undefined && tmp[f]===splitted[f]) {
                        results[i] = results[i] !== undefined ? results[i]+1 : 1;
                    }
                }
            }

            let max = Math.max.apply(Math, results.map(function(o) { return o; }));
            let count = results.filter((i) => i === max).length;

            if(count===1) filePath = fileMatch.files[results.indexOf(max)];

        }

        if(filePath !== undefined) {
            fileMatch.ranges.forEach(range => {
                results.push(new vscode.DocumentLink(range, vscode.Uri.file(filePath as string)));
            });
        }

        return results;
    }

    private fileExists(_path: string): boolean {
        if(fs.existsSync(_path)) return fs.lstatSync(_path).isFile();
        else return false;
    }

    private walkSync(dir: string, findList: string[], filelist: string[] = []) {
        let lp = this;
        let files = fs.readdirSync(dir);
        filelist = filelist || [];
        files.forEach(function(file) {
            if (fs.statSync(path.join(dir, file)).isDirectory()) 
                filelist = lp.walkSync(path.join(dir, file), findList, filelist);
            else if(findList.includes(file)) 
                filelist.push(path.join(dir, file));
        });
        return filelist;
    }

}