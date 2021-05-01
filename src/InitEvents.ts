import * as vscode from 'vscode';
import { FileSystemHelper } from './FileSystemHelper';

export let initEvents = (fsHelper: FileSystemHelper, context: vscode.ExtensionContext) => {

    if(vscode.workspace.workspaceFolders) fsHelper.loadWsFiles(vscode.workspace.workspaceFolders.map((item) => item.uri));

    let events: vscode.Disposable[] = [];

    events.push(vscode.workspace.onDidChangeWorkspaceFolders(fsHelper.onChangeWorkspace));

    events.push(vscode.workspace.onDidCreateFiles((event: vscode.FileCreateEvent) => {
        let touchedWs = FileSystemHelper.getTouchedWs(event.files);
        fsHelper.loadWsFiles(touchedWs);
    }));

    events.push(vscode.workspace.onDidDeleteFiles((event: vscode.FileDeleteEvent) => {
        let touchedWs = FileSystemHelper.getTouchedWs(event.files);
        fsHelper.loadWsFiles(touchedWs);
    }));

    events.push(vscode.workspace.onDidRenameFiles((event: vscode.FileRenameEvent) => {
        let touchedWs = FileSystemHelper.getTouchedWs(event.files.map((item) => item.newUri));
        fsHelper.loadWsFiles(touchedWs);
    }));

    for(const event of events) context.subscriptions.push(event);

    return events;
};