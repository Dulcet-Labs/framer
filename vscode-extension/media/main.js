// Main Logic Module
document.addEventListener('DOMContentLoaded', () => {
    const vscode = acquireVsCodeApi();
    window.vscode = vscode; // Expose for ui.js
    const urlInput = document.getElementById('app-url-input');
    const urlInputContainer = document.getElementById('url-input-container');

    // Forward console logs
    const originalLog = console.log;
    console.log = function (...args) {
        originalLog.apply(console, args);
        const text = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
        vscode.postMessage({ command: 'log', text: text });
    };

    const originalError = console.error;
    console.error = function (...args) {
        originalError.apply(console, args);
        const text = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
        vscode.postMessage({ command: 'error', text: text });
    };

    // URL Input Handler
    if (urlInput) {
        urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                let url = urlInput.value.trim();
                if (url) {
                    // Smart Localhost
                    if (url.toLowerCase() === 'localhost') {
                        window.scanLocalhostPorts().then(foundUrl => {
                            if (foundUrl) {
                                loadUrl(foundUrl);
                            } else {
                                loadUrl('http://localhost:3000');
                            }
                        });
                        urlInputContainer.classList.add('hidden');
                        return;
                    }

                    // Default protocol
                    if (!url.startsWith('http://') && !url.startsWith('https://')) {
                        if (url.includes('localhost') || url.includes('127.0.0.1')) {
                            url = 'http://' + url;
                        } else {
                            url = 'https://' + url;
                        }
                    }

                    loadUrl(url);
                    urlInputContainer.classList.add('hidden');
                }
            }
        });
    }

    function loadUrl(url) {
        let appName = 'Mini App';
        let faviconUrl = window.defaultIconUri || 'myApp.svg';

        try {
            const urlObj = new URL(url);
            let hostname = urlObj.hostname.replace(/^www\./, '');
            appName = hostname.split('.')[0];
            appName = appName.charAt(0).toUpperCase() + appName.slice(1);
            if (appName === 'localhost' || appName === '127.0.0.1') {
                appName = `Localhost:${urlObj.port}`;
                // Try to get favicon from localhost, fallback to default
                faviconUrl = `${urlObj.protocol}//${urlObj.host}/favicon.ico`;
            } else {
                faviconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
            }
        } catch (e) {
            appName = 'External Link';
        }

        loadMiniApp({
            name: appName,
            icon: faviconUrl,
            url: url
        }, true); // Expand on explicit load
    }

    window.loadMiniApp = function (config, shouldExpand = false) {
        const { name, icon, url } = config;
        const appNameEl = document.getElementById('app-name');
        const appIconEl = document.getElementById('app-icon');
        const appFrame = document.getElementById('app-frame');
        const emptyState = document.getElementById('empty-state');
        const loadingState = document.getElementById('loading-state');
        const errorState = document.getElementById('error-state');
        const progressContainer = document.getElementById('progress-container');
        const progressBar = progressContainer ? progressContainer.querySelector('.progress-bar') : null;

        if (appNameEl) appNameEl.textContent = name;

        if (appIconEl) {
            appIconEl.innerHTML = `<img src="${icon}" alt="${name}" class="app-icon-img" onerror="this.src='${window.defaultIconUri}'">`;
        }

        if (appFrame) {
            if (url && url !== 'about:blank') {
                if (progressContainer) progressContainer.classList.remove('hidden');
                if (progressBar) progressBar.classList.add('loading');
                if (loadingState) loadingState.classList.add('hidden');
                if (emptyState) emptyState.style.display = 'none';
                if (errorState) errorState.classList.add('hidden');
                appFrame.classList.add('hidden');

                vscode.postMessage({ command: 'checkUrl', url: url });
                appFrame.src = url;

                const startLoad = Date.now();
                appFrame.onload = () => {
                    const elapsed = Date.now() - startLoad;
                    const remaining = Math.max(0, 500 - elapsed);
                    setTimeout(() => {
                        if (errorState && errorState.classList.contains('hidden')) {
                            if (progressContainer) progressContainer.classList.add('hidden');
                            if (progressBar) progressBar.classList.remove('loading');
                            appFrame.classList.remove('hidden');
                        }
                    }, remaining);
                };

                appFrame.onerror = () => {
                    if (progressContainer) progressContainer.classList.add('hidden');
                    if (progressBar) progressBar.classList.remove('loading');
                    if (errorState) errorState.classList.remove('hidden');
                };

                if (shouldExpand && window.isCollapsed && window.toggleModal) {
                    window.toggleModal();
                }
            } else {
                appFrame.src = 'about:blank';
                appFrame.classList.add('hidden');
                if (progressContainer) progressContainer.classList.add('hidden');
                if (loadingState) loadingState.classList.add('hidden');
                if (errorState) errorState.classList.add('hidden');
                if (emptyState) emptyState.style.display = 'flex';
            }
        }
    };

    // Auto-detect localhost
    let hasAutoLoaded = false;
    async function checkAndLoadLocalhost() {
        const appFrame = document.getElementById('app-frame');
        const isBlank = !appFrame.src || appFrame.src === 'about:blank' || appFrame.classList.contains('hidden');

        if (isBlank && !hasAutoLoaded) {
            const foundUrl = await window.scanLocalhostPorts();
            if (foundUrl) {
                hasAutoLoaded = true;
                loadUrl(foundUrl);
            }
        }
    }

    checkAndLoadLocalhost();
    const autoCheckInterval = setInterval(() => {
        if (hasAutoLoaded) {
            clearInterval(autoCheckInterval);
        } else {
            checkAndLoadLocalhost();
        }
    }, 2000);

    // Message Handler
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'restoreWallet':
                if (message.wallet && window.restoreWalletUI) {
                    window.restoreWalletUI(message.wallet);
                }
                break;
            case 'urlCheckResult':
                const loadingState = document.getElementById('loading-state');
                const errorState = document.getElementById('error-state');
                const appFrame = document.getElementById('app-frame');
                const progressContainer = document.getElementById('progress-container');
                const progressBar = progressContainer ? progressContainer.querySelector('.progress-bar') : null;

                if (message.blocked) {
                    if (loadingState) loadingState.classList.add('hidden');
                    if (progressContainer) progressContainer.classList.add('hidden');
                    if (progressBar) progressBar.classList.remove('loading');
                    if (appFrame) {
                        appFrame.classList.add('hidden');
                        appFrame.src = 'about:blank';
                    }
                    if (errorState) {
                        errorState.classList.remove('hidden');
                        const msgEl = errorState.querySelector('.error-message');
                        if (msgEl) msgEl.textContent = "This website blocks access from VS Code (X-Frame-Options/CSP).";
                    }
                } else {
                    if (errorState) errorState.classList.add('hidden');
                }
                break;
            case 'loadUrl':
                if (message.url) {
                    loadUrl(message.url);
                }
                break;
        }
    });

    // Initialize
    const startUrl = window.initialUrl || '';
    if (startUrl) {
        loadUrl(startUrl);
    } else {
        loadMiniApp({
            name: 'Mini Apps',
            icon: window.defaultIconUri,
            url: ''
        });
    }
});
