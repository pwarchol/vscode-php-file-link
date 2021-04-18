import * as vscode from 'vscode';
import { LinkProvider } from './LinkProvider';


export function activate(context: vscode.ExtensionContext) {

    vscode.languages.registerDocumentLinkProvider('php', new LinkProvider());

}

export function deactivate() {}
