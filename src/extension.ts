import * as vscode from 'vscode';
import { TodoViewProvider } from './todoViewProvider';

export function activate(context: vscode.ExtensionContext) {
    const provider = new TodoViewProvider(context.extensionUri, context.globalState);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'todoListView',
            provider
        )
    );
}

export function deactivate() { }
