import * as vscode from 'vscode';

export function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri, initialUrl?: string): string {
    // Local path to scripts
    const mainScriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'main.js'));
    const uiScriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'ui.js'));
    const scannerScriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'scanner.js'));

    // Local path to css
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'style.css'));

    // Local path to images
    const iconUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'myApp.svg'));

    // Assets
    const nonce = getNonce();

    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src *; style-src ${webview.cspSource} 'unsafe-inline' https://fonts.googleapis.com; font-src ${webview.cspSource} https://fonts.gstatic.com; img-src * 'self' data: https: http: blob: ${webview.cspSource}; media-src * 'self' data: https: http: blob: ${webview.cspSource}; script-src 'nonce-${nonce}' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; frame-src *;">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="${styleUri}" rel="stylesheet">
            <title>Framer Model</title>
        </head>
        <body>
            <div id="mini-app-modal" class="mini-app-modal collapsed">
                <div class="modal-header">
                    <div class="modal-title">
                        <span id="app-icon" class="app-icon"><img src="${iconUri}" alt="myApp" class="app-icon-img"></span>
                        <span id="app-name" class="app-name">Mini Apps</span>
                    </div>
                    <div class="modal-controls">
                        <div id="url-input-container" class="url-input-container hidden">
                            <input type="text" id="app-url-input" placeholder="http://localhost:3000" class="url-input">
                        </div>
                        <button id="toggle-url-btn" class="icon-btn" aria-label="Enter URL">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </button>
                        <button id="toggle-expand-btn" class="icon-btn" aria-label="Toggle View">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="18 15 12 9 6 15"></polyline>
                            </svg>
                        </button>
                        <button class="icon-btn" aria-label="Wallet" id="wallet-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                <line x1="1" y1="10" x2="23" y2="10"></line>
                            </svg>
                        </button>
                        <button class="icon-btn" aria-label="Refresh" id="refresh-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round">
                                <path d="M23 4v6h-6"></path>
                                <path d="M1 20v-6h6"></path>
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                            </svg>
                        </button>
                        <button class="icon-btn" aria-label="Scale" id="scale-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                <line x1="11" y1="8" x2="11" y2="14"></line>
                                <line x1="8" y1="11" x2="14" y2="11"></line>
                            </svg>
                        </button>
                    </div>
                </div>
                <div id="progress-container" class="progress-container hidden">
                    <div class="progress-bar"></div>
                </div>
                <div class="modal-body">
                    <div id="sheet-overlay" class="sheet-overlay"></div>
                    <div id="empty-state" class="empty-state">
                        <img src="${iconUri}" alt="FramerIDE" class="empty-state-logo">
                    </div>
                    <div id="loading-state" class="loading-state hidden">
                        <div class="spinner"></div>
                    </div>
                    <div id="error-state" class="error-state hidden">
                        <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <div class="error-title">Unable to Load</div>
                        <div class="error-message">This website likely blocks access from other apps (X-Frame-Options).</div>
                    </div>
                    <iframe id="app-frame" src="about:blank" title="Mini App" class="hidden" allow="clipboard-read *; clipboard-write *; web-share *; camera *; microphone *; geolocation *"></iframe>
                    
                    <!-- Wallet Sheet -->
                    <div id="wallet-sheet" class="secondary-sheet">
                        <div class="sheet-header">
                            <span>Base Account</span>
                            <button id="close-wallet-btn" class="sheet-close-btn">Close</button>
                        </div>
                        <div class="sheet-body">
                            <!-- View 0: Welcome / Onboarding -->
                            <div id="wallet-welcome-view" class="wallet-login-view">
                                <div class="base-logo" style="background: linear-gradient(135deg, #0052FF, #509BF5); box-shadow: 0 8px 24px rgba(0, 82, 255, 0.3);">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="none">
                                        <path d="M21 7.28V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-2.28c.59-.35 1-.98 1-1.72V9c0-.74-.41-1.37-1-1.72zM20 9v6h-7V9h7zM5 19V5h14v2h-6c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h6v2H5z"/>
                                        <circle cx="16" cy="12" r="1.5"/>
                                    </svg>
                                </div>
                                <h2 style="margin-bottom: 12px; font-size: 1.5rem; font-weight: 700;">Welcome to Framer IDE</h2>
                                <p style="opacity: 0.7; margin-bottom: 40px; line-height: 1.6; max-width: 280px; font-size: 0.95rem;">
                                    Set up your Wallet to better test your mini apps. Simulate transactions and identity in a sandbox environment.
                                </p>
                                <button id="wallet-get-started-btn" class="login-btn">Connect Wallet</button>
                            </div>

                            <!-- View 1: Login -->
                            <div id="wallet-login-view" class="wallet-login-view hidden">
                                <div class="base-logo" style="background: white; border: 1px solid var(--border-color);">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0052FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                                        <polyline points="10 17 15 12 10 7"/>
                                        <line x1="15" y1="12" x2="3" y2="12"/>
                                    </svg>
                                </div>
                                <h2 style="margin-bottom: 8px; font-weight: 600;">Sign in with Passkey</h2>
                                <p style="opacity: 0.7; margin-bottom: 32px; font-size: 0.9rem;">Scan to connect your Base Smart Wallet.</p>
                                <button id="login-passkey-btn" class="login-btn">Log in / Sign up</button>
                            </div>

                            <!-- View 2: Scan -->
                            <div id="wallet-scan-view" class="qr-view hidden">
                                <div class="qr-code">
                                    <!-- Placeholder QR -->
                                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=base-smart-wallet-demo" alt="Scan to Login" style="width:100%; height:100%; opacity: 0.9;">
                                </div>
                                <p style="opacity: 0.8; font-size: 0.9rem;">Scan with your phone camera</p>
                                <div class="spinner" style="margin-top: 20px; width: 24px; height: 24px; border-width: 2px;"></div>
                            </div>

                            <!-- View 3: Profile -->
                            <div id="wallet-profile-view" class="profile-view hidden">
                                <div class="avatar-large"></div>
                                <div class="wallet-balance">
                                    <div class="balance-label">0.00 ETH</div>
                                    <div class="balance-display">$0.00</div>
                                </div>
                                <div class="wallet-actions">
                                    <button id="pay-btn" class="secondary-btn" style="width: 100%; margin-bottom: 10px;">Pay with Base (Demo)</button>
                                    <button id="disconnect-btn" class="secondary-btn" style="width: 100%;">Disconnect</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Settings Sheet -->
                    <div id="settings-sheet" class="secondary-sheet">
                        <div class="sheet-header">
                            <span>Settings</span>
                            <button id="close-sheet-btn" class="sheet-close-btn">Done</button>
                        </div>
                        <div class="sheet-body">
                            <p style="opacity: 0.7; font-size: 0.9rem;">This is a secondary sheet that floats above your app.</p>
                            <div style="margin-top: 20px; padding: 12px; background: var(--vscode-editor-inactiveSelectionBackground); border-radius: 8px;">
                                <strong>Simulator Options</strong>
                                <div style="margin-top: 8px; display: flex; align-items: center; gap: 8px;">
                                    <input type="checkbox" checked> <span>Mock Wallet</span>
                                </div>
                                <div style="margin-top: 8px; display: flex; align-items: center; gap: 8px;">
                                    <input type="checkbox"> <span>Dark Mode</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <script nonce="${nonce}">
                window.defaultIconUri = "${iconUri}";
                window.initialUrl = "${initialUrl || ''}";
            </script>
            <script src="https://unpkg.com/@base-org/account/dist/base-account.min.js"></script>
            <script nonce="${nonce}" src="${scannerScriptUri}"></script>
            <script nonce="${nonce}" src="${uiScriptUri}"></script>
            <script nonce="${nonce}" src="${mainScriptUri}"></script>
        </body>
        </html>`;
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
