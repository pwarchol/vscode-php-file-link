import * as vscode from 'vscode';
import { LinkProvider } from './LinkProvider';


export function activate(context: vscode.ExtensionContext) {

    let linkProvider = new LinkProvider();
    vscode.languages.registerDocumentLinkProvider('php', linkProvider);

}

export function deactivate() {}
