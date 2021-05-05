import * as vscode from 'vscode';
import { FileSystemHelper } from './FileSystemHelper';

export let initEvents = (fsHelper: FileSystemHelper, context: vscode.ExtensionContext) => {

    let events: vscode.Disposable[] = [];

    events.push(vscode.workspace.onDidChangeWorkspaceFolders((event: vscode.WorkspaceFoldersChangeEvent) => {
        fsHelper.clearExtWsState(event.removed.map((item) => item.uri));
    }));

    events.push(vscode.workspace.onDidCreateFiles((event: vscode.FileCreateEvent) => {
        let touchedWs = FileSystemHelper.getTouchedWs(event.files);
        fsHelper.clearExtWsState(touchedWs);
    }));

    events.push(vscode.workspace.onDidDeleteFiles((event: vscode.FileDeleteEvent) => {
        let touchedWs = FileSystemHelper.getTouchedWs(event.files);
        fsHelper.clearExtWsState(touchedWs);
    }));

    events.push(vscode.workspace.onDidRenameFiles((event: vscode.FileRenameEvent) => {
        let touchedWs = FileSystemHelper.getTouchedWs(event.files.map((item) => item.newUri));
        fsHelper.clearExtWsState(touchedWs);
    }));

    for(const event of events) context.subscriptions.push(event);

    return events;
};