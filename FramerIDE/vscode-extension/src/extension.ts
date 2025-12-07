import * as vscode from 'vscode';
import { getWebviewContent } from './webview-html';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "framer-mini-app-preview" is now active!');

    // Command to start the preview
    context.subscriptions.push(
        vscode.commands.registerCommand('framer.start', (url?: string) => {
            BaseFramePanel.createOrShow(context.extensionUri, context, url);
        })
    );

    // Create Status Bar Item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'framer.start';
    statusBarItem.text = '$(device-mobile) Framer Preview';
    statusBarItem.tooltip = 'Start Framer Mini App Preview';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Auto-detect localhost ports
    const PORTS = [3000, 3001, 5173, 8000, 8080, 4200];
    let intervalHandle: NodeJS.Timeout;

    const checkServer = () => {
        // If panel is already open, stop checking
        if (BaseFramePanel.currentPanel) {
            if (intervalHandle) clearInterval(intervalHandle);
            return;
        }

        PORTS.forEach(port => {
            const http = require('http');
            const options = {
                hostname: 'localhost',
                port: port,
                method: 'HEAD',
                timeout: 2000 // 2s timeout
            };

            const req = http.request(options, (res: any) => {
                // Server is running!
                if (BaseFramePanel.currentPanel) return;

                vscode.window.showInformationMessage(`🚀 Detected app on localhost:${port}`, 'Open Preview')
                    .then(selection => {
                        if (selection === 'Open Preview') {
                            vscode.commands.executeCommand('framer.start', `http://localhost:${port}`);
                        }
                    });

                // Stop polling once found
                if (intervalHandle) {
                    clearInterval(intervalHandle);
                }
            });

            req.on('timeout', () => {
                req.destroy();
            });

            req.on('error', (e: any) => {
                // Not running
            });
            req.end();
        });
    };

    // Check every 3 seconds
    intervalHandle = setInterval(checkServer, 3000);
    context.subscriptions.push({ dispose: () => clearInterval(intervalHandle) });
}

export function deactivate() { }

class BaseFramePanel {
    public static currentPanel: BaseFramePanel | undefined;

    public static readonly viewType = 'baseFrame';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext, initialUrl?: string) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (BaseFramePanel.currentPanel) {
            BaseFramePanel.currentPanel._panel.reveal(column);
            if (initialUrl) {
                BaseFramePanel.currentPanel._panel.webview.postMessage({ command: 'loadUrl', url: initialUrl });
            }
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            BaseFramePanel.viewType,
            'Base Frame Preview',
            column || vscode.ViewColumn.One,
            {
                // Enable javascript in the webview
                enableScripts: true,
                // Restrict the webview to only loading content from our extension's `media` directory.
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
                //Persist state
                retainContextWhenHidden: true
            }
        );

        BaseFramePanel.currentPanel = new BaseFramePanel(panel, extensionUri, context, initialUrl);
    }

    private readonly _context: vscode.ExtensionContext;

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, context: vscode.ExtensionContext, initialUrl?: string) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._context = context;

        // Set the webview's initial html content
        this._update(initialUrl);

        // Listen for when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Update the content based on view changes
        // Update the content based on view changes
        // We do NOT want to update on visibility change because it resets the webview state
        // even with retainContextWhenHidden: true.
        /*
        this._panel.onDidChangeViewState(
            e => {
                if (this._panel.visible) {
                    this._update();
                }
            },
            null,
            this._disposables
        );
        */

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'saveWallet':
                        this._panel.webview.postMessage({ command: 'log', text: 'Saving wallet state' });
                        // Persist to global state
                        // We need access to context here. 
                        // Since BaseFramePanel is a class, we should pass context to it or use a static reference.
                        // For now, let's just keep it in memory for the session or try to access extension context if possible.
                        // Actually, we can pass the context in the constructor.
                        if (this._context) {
                            this._context.globalState.update('mockWallet', message.wallet);
                        }
                        return;
                    case 'alert':
                        vscode.window.showErrorMessage(message.text);
                        return;
                    case 'log':
                        console.log(`[Mini App Log]: ${message.text}`);
                        return;
                    case 'error':
                        console.error(`[Mini App Error]: ${message.text}`);
                        vscode.window.showErrorMessage(`Mini App Error: ${message.text}`);
                        return;
                    case 'openExternal':
                        if (message.url) {
                            vscode.env.openExternal(vscode.Uri.parse(message.url));
                        }
                        return;
                    case 'checkUrl':
                        try {
                            const targetUrl = message.url;
                            const protocol = targetUrl.startsWith('https') ? require('https') : require('http');
                            const req = protocol.request(targetUrl, { method: 'HEAD' }, (res: any) => {
                                const headers = res.headers;
                                const xFrameOptions = headers['x-frame-options']?.toLowerCase();
                                const csp = headers['content-security-policy']?.toLowerCase();

                                let blocked = false;

                                // Check X-Frame-Options
                                if (xFrameOptions) {
                                    if (xFrameOptions.includes('deny') || xFrameOptions.includes('sameorigin')) {
                                        blocked = true;
                                    }
                                }

                                // Check CSP frame-ancestors
                                if (csp) {
                                    if (csp.includes('frame-ancestors')) {
                                        // If it has frame-ancestors, it likely blocks us unless we are explicitly allowed (unlikely for generic sites)
                                        // frame-ancestors 'none' or 'self' are definite blocks
                                        if (csp.includes("'none'") || csp.includes("'self'")) {
                                            blocked = true;
                                        }
                                        // Even if it lists domains, it won't list 'vscode-webview://' usually, so it's effectively blocked
                                        // But we'll be conservative and only block if we see restrictive keywords or if it doesn't include *
                                        if (!csp.includes('*') && !csp.includes('vscode-webview')) {
                                            blocked = true;
                                        }
                                    }
                                }

                                BaseFramePanel.currentPanel?._panel.webview.postMessage({ command: 'urlCheckResult', blocked: blocked });
                            });
                            req.on('error', () => {
                                BaseFramePanel.currentPanel?._panel.webview.postMessage({ command: 'urlCheckResult', blocked: true });
                            });
                            req.end();
                        } catch (e) {
                            BaseFramePanel.currentPanel?._panel.webview.postMessage({ command: 'urlCheckResult', blocked: true });
                        }
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public dispose() {
        BaseFramePanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update(initialUrl?: string) {
        const webview = this._panel.webview;
        this._panel.title = "Base Frame Preview";
        this._panel.webview.html = getWebviewContent(webview, this._extensionUri, initialUrl);

        // Restore wallet state
        const savedWallet = this._context.globalState.get('mockWallet');
        if (savedWallet) {
            this._panel.webview.postMessage({ command: 'restoreWallet', wallet: savedWallet });
        }
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
