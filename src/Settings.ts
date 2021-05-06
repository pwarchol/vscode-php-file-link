import * as vscode from 'vscode';

/**
 * Settings as functions for always actual information.
 */
export class Settings {

    static appName = 'phpFileLink';

    static devMode = () => {
        return vscode.env.sessionId === 'someValue.sessionId';
    };

    static supportedExtensions = (): string[] => {
        return vscode.workspace.getConfiguration().get(Settings.appName+'.supportedExtensions') || ['php','ini','log'];
    };

    static showLinksForFilesThatDoNotExist = (): boolean => {
        return false;
    };

    static cacheWorkspaceFiles = (): boolean => {
        let cfgVal = vscode.workspace.getConfiguration().get(Settings.appName+'.cacheWorkspaceFiles');
        return typeof cfgVal === 'boolean' ? cfgVal : false;
    };

    static refreshCacheEvery = (): number => {
        return vscode.workspace.getConfiguration().get(Settings.appName+'.refreshCacheEvery') || 120;
    };

}