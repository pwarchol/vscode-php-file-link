import * as vscode from 'vscode';
import { LinkProvider } from './LinkProvider';
import { FileSystemHelper } from './FileSystemHelper';
import { Settings } from './Settings';
import { initEvents } from './InitEvents';

export function activate(context: vscode.ExtensionContext) {

    let fsHelper = new FileSystemHelper(context);

    let events: vscode.Disposable[] | undefined;

    if(Settings.cacheWorkspaceFiles()) events = initEvents(fsHelper, context);

    vscode.workspace.onDidChangeConfiguration((e) => {
        if(e.affectsConfiguration(Settings.appName)) {
            if(Settings.cacheWorkspaceFiles()) {
                if(!events) events = initEvents(fsHelper, context);
            } else if(events) {
                for(const e of events) e.dispose();
                events = undefined;
            }
        }
    });

    let linkProvider = new LinkProvider(fsHelper);
    vscode.languages.registerDocumentLinkProvider('php', linkProvider);

}

export function deactivate() {}
