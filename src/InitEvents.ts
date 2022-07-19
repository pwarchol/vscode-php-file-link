import * as vscode from 'vscode';
import { FileSystemHelper } from './FileSystemHelper';

export let initEvents = (fsHelper: FileSystemHelper, context: vscode.ExtensionContext) => {

    let events: vscode.Disposable[] = [];

    events.push(vscode.workspace.onDidCreateFiles((event: vscode.FileCreateEvent) => {
        let touchedWs = FileSystemHelper.getTouchedWs(event.files);
        fsHelper.reloadCacheFiles(touchedWs);
    }));

    events.push(vscode.workspace.onDidDeleteFiles((event: vscode.FileDeleteEvent) => {
        let touchedWs = FileSystemHelper.getTouchedWs(event.files);
        fsHelper.reloadCacheFiles(touchedWs);
    }));

    events.push(vscode.workspace.onDidRenameFiles((event: vscode.FileRenameEvent) => {
        let touchedWs = FileSystemHelper.getTouchedWs(event.files.map((item) => item.newUri));
        fsHelper.reloadCacheFiles(touchedWs);
    }));

    for(const event of events) context.subscriptions.push(event);

    return events;
};