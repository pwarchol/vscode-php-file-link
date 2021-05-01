import * as vscode from 'vscode';

/**
 * Settings as functions for always actual information.
 */
export class Settings {

    static supportedExtensions = (): string[] => {
        return vscode.workspace.getConfiguration().get('phpFileLink.supportedExtensions') || ['php','ini','log'];
    };

    static showLinksForFilesThatDoNotExist = (): boolean => {
        return false;
    };

    static excludeScanFolders = (): string[] => {
        return vscode.workspace.getConfiguration().get('phpFileLink.excludeScanFolders') || ['node_modules'];
    };

    static cacheWorkspaceFiles = (): boolean => {
        let cfgVal = vscode.workspace.getConfiguration().get('phpFileLink.cacheWorkspaceFiles');
        return typeof cfgVal === "boolean" ? cfgVal : false;
    };

}