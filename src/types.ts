import * as vscode from 'vscode';

export interface FileMatch {
    value: string;
    ranges: vscode.Range[];
    files: string[];
    filename: string;
}

export interface AstResult {
    value: string;
    astPath: string[];
    range: vscode.Range;
    workingDir: boolean;
}

export class MyLink extends vscode.DocumentLink {

    fileMatch: FileMatch;
    document: vscode.TextDocument;

    constructor(range: vscode.Range, fileMatch: FileMatch, document: vscode.TextDocument, target?: vscode.Uri) {
        super(range,target);
        this.fileMatch = fileMatch;
        this.document = document;
    }
}