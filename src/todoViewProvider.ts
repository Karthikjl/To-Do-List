import * as vscode from 'vscode';

export class TodoViewProvider implements vscode.WebviewViewProvider {
  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly storage: vscode.Memento
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(message => {
      if (!message || typeof message !== 'object') return;

      switch (message.type) {
        case 'save': {
          if (Array.isArray(message.tasks)) {
            this.storage.update('tasks', message.tasks);
          }
          break;
        }

        case 'load': {
          const saved = this.storage.get<any[]>('tasks', []);
          webviewView.webview.postMessage({
            type: 'load',
            tasks: Array.isArray(saved) ? saved : []
          });
          break;
        }
      }
    });
  }

  private getHtml(webview: vscode.Webview) {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'styles.css')
    );

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'script.js')
    );

    const nonce = this.getNonce();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">

  <meta http-equiv="Content-Security-Policy"
    content="
      default-src 'none';
      style-src ${webview.cspSource} https://fonts.googleapis.com;
      font-src https://fonts.gstatic.com;
      script-src 'nonce-${nonce}';
    ">

  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${styleUri}">
</head>

<body>
  <div class="app">
    <div class="header">
      <h2>To-Do List</h2>
      <div class="stats" id="stats"></div>

      <!-- Progress bar -->
      <div class="progress-wrap">
        <div class="progress-bar" id="progressBar"></div>
      </div>
    </div>

    <div class="glass input-row">
      <input id="taskInput" placeholder="Add a task..." />
      <input id="dueInput" type="date" />
      <input id="categoryInput" placeholder="Category..." />

      <select id="priority">
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>

      <button id="addBtn">Add</button>
    </div>

    <input class="glass search" id="search" placeholder="Search..." />

    <div class="tasks" id="tasks"></div>
  </div>

  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>
`;
  }

  private getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
