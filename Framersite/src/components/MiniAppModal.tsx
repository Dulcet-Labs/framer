import { useRef, useState, useEffect } from 'react';
import { useAccount, useConfig } from 'wagmi';
import { getWalletClient } from '@wagmi/core';

export interface MiniAppConfig {
    name: string;
    icon: string;
    url: string;
}

interface MiniAppModalProps {
    miniApp: MiniAppConfig;
    isAppCollapsed: boolean;
    setMiniApp: (config: MiniAppConfig) => void;
    setIsAppCollapsed: (collapsed: boolean) => void;
}

export function MiniAppModal({ miniApp, isAppCollapsed, setMiniApp, setIsAppCollapsed }: MiniAppModalProps) {
    const [isUrlInputVisible, setIsUrlInputVisible] = useState(false);
    const [urlInputValue, setUrlInputValue] = useState('');
    const [isAppLoading, setIsAppLoading] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Wallet Bridge
    const config = useConfig();
    const { address, isConnected } = useAccount();

    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            // Verify message comes from the iframe
            if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return;

            const { data } = event;

            // Basic JSON-RPC message structure check
            if (data && typeof data === 'object' && data.method) {
                console.log('[Parent] Received request from iframe:', data.method, data.params);

                try {
                    let result;

                    // Handle specific methods or forward to walletClient
                    if (data.method === 'eth_requestAccounts' || data.method === 'eth_accounts') {
                        if (isConnected && address) {
                            result = [address];
                        } else {
                            // Can't automatically connect from iframe trigger without user interaction in parent usually.
                            // Return empty array to indicate no accounts, or error.
                            // Some dapps prefer empty array for eth_accounts.
                            result = [];
                        }
                    } else {
                        // For transaction/signing requests, we need the wallet client.
                        // Fetching fresh client ensures we don't use a stale one.
                        // We must specify the account to ensure we get the client for the connected user.
                        const client = await getWalletClient(config, { account: address });

                        if (client) {
                            result = await client.request({
                                method: data.method,
                                params: data.params,
                            });
                        } else {
                            throw new Error('Connector not connected');
                        }
                    }

                    // Send success response
                    if (iframeRef.current && iframeRef.current.contentWindow) {
                        const response = {
                            jsonrpc: '2.0',
                            id: data.id,
                            result: result
                        };
                        iframeRef.current.contentWindow.postMessage(response, event.origin);
                    }

                } catch (error: any) {
                    console.error('[Parent] Error handling iframe request:', error);
                    // Send error response
                    if (iframeRef.current && iframeRef.current.contentWindow) {
                        const response = {
                            jsonrpc: '2.0',
                            id: data.id,
                            error: {
                                code: error.code || -32603,
                                message: error.message || 'Internal Error',
                                data: error.data
                            }
                        };
                        iframeRef.current.contentWindow.postMessage(response, event.origin);
                    }
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [config, address, isConnected]);

    const handleUrlSubmit = () => {
        let url = urlInputValue.trim();
        if (!url) return;

        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        let domain = url;
        try {
            const urlObj = new URL(url);
            domain = urlObj.hostname;
        } catch (e) {
            console.error('Invalid URL');
        }

        setMiniApp({
            name: domain,
            icon: `https://www.google.com/s2/favicons?domain=${url}&sz=64`,
            url: url,
        });

        setIsAppLoading(true);
        setIsUrlInputVisible(false);
        setUrlInputValue('');
    };

    const handleRefresh = () => {
        const btn = document.getElementById('refresh-btn-svg');
        if (btn) {
            btn.style.transition = 'transform 0.5s ease';
            btn.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                btn.style.transition = 'none';
                btn.style.transform = 'rotate(0deg)';
            }, 500);
        }

        if (iframeRef.current) {
            setIsAppLoading(true);
            const currentSrc = iframeRef.current.src;
            iframeRef.current.src = currentSrc;
        }
    };

    const handleIframeLoad = () => {
        setIsAppLoading(false);

        // Inject wallet provider into iframe
        if (iframeRef.current && miniApp.url) {
            try {
                injectWalletProvider();
            } catch (error) {
                console.warn('[Parent] Could not inject wallet provider (likely cross-origin):', error);
            }
        }
    };

    const injectWalletProvider = () => {
        if (!iframeRef.current?.contentWindow) return;

        const iframeWindow = iframeRef.current.contentWindow;

        // Check if same-origin (we can only inject into same-origin iframes directly)
        try {
            const isSameOrigin = iframeWindow.location.origin === window.location.origin;

            if (isSameOrigin) {
                // For same-origin, we can directly inject
                const script = iframeWindow.document.createElement('script');
                script.textContent = getProviderScript();
                iframeWindow.document.head.appendChild(script);
                console.log('[Parent] ✅ Injected wallet provider (same-origin)');
            } else {
                // For cross-origin, we need to send the script via postMessage
                // and have the iframe execute it (requires iframe cooperation)
                iframeWindow.postMessage({
                    type: 'INJECT_PROVIDER',
                    script: getProviderScript()
                }, '*');
                console.log('[Parent] 📤 Sent provider injection request (cross-origin)');
            }
        } catch (e) {
            console.warn('[Parent] Cross-origin iframe detected, attempting postMessage injection');
            iframeWindow.postMessage({
                type: 'INJECT_PROVIDER',
                script: getProviderScript()
            }, '*');
        }
    };

    const getProviderScript = () => {
        return `
(function() {
    if (window.ethereum) {
        console.log('[Iframe] Wallet provider already exists, skipping injection');
        return;
    }

    console.log('[Iframe] 🔌 Injecting proxy wallet provider...');

    let requestId = 0;
    const pendingRequests = new Map();
    let currentChainId = '0x2105'; // Base mainnet

    // Listen for responses from parent
    window.addEventListener('message', (event) => {
        const { data } = event;
        if (data && data.jsonrpc === '2.0' && data.id !== undefined) {
            const pending = pendingRequests.get(data.id);
            if (pending) {
                pendingRequests.delete(data.id);
                if (data.error) {
                    pending.reject(new Error(data.error.message || 'Request failed'));
                } else {
                    // Update chainId if this was a chainId request
                    if (pending.method === 'eth_chainId' && data.result) {
                        currentChainId = data.result;
                    }
                    pending.resolve(data.result);
                }
            }
        }
    });

    // Create EIP-1193 compatible provider
    const provider = {
        isMetaMask: false,
        isCoinbaseWallet: true,
        isFramerIDE: true,
        chainId: currentChainId,
        
        request: async ({ method, params }) => {
            const id = ++requestId;
            
            return new Promise((resolve, reject) => {
                pendingRequests.set(id, { resolve, reject, method });
                
                // Send request to parent
                window.parent.postMessage({
                    jsonrpc: '2.0',
                    id,
                    method,
                    params: params || []
                }, '*');

                // Timeout after 60 seconds
                setTimeout(() => {
                    if (pendingRequests.has(id)) {
                        pendingRequests.delete(id);
                        reject(new Error('Request timeout'));
                    }
                }, 60000);
            });
        },

        // Legacy methods for older dapps
        enable: async () => {
            return provider.request({ method: 'eth_requestAccounts' });
        },

        send: (methodOrPayload, paramsOrCallback) => {
            if (typeof methodOrPayload === 'string') {
                return provider.request({ 
                    method: methodOrPayload, 
                    params: paramsOrCallback 
                });
            }
            // Legacy send with callback
            return provider.request(methodOrPayload)
                .then(result => paramsOrCallback(null, { result }))
                .catch(error => paramsOrCallback(error));
        },

        sendAsync: (payload, callback) => {
            provider.request(payload)
                .then(result => callback(null, { result }))
                .catch(error => callback(error));
        },

        on: (event, callback) => {
            // Minimal event emitter for compatibility
            console.log('[Iframe] Event listener registered:', event);
        },

        removeListener: () => {},
        removeAllListeners: () => {}
    };

    window.ethereum = provider;

    // EIP-6963: Announce provider for Wagmi v3 compatibility
    const announceProvider = () => {
        const info = {
            uuid: 'framer-ide-injected-provider',
            name: 'FramerIDE',
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%230052FF"/></svg>',
            rdns: 'com.framer.ide'
        };

        window.dispatchEvent(
            new CustomEvent('eip6963:announceProvider', {
                detail: Object.freeze({ info, provider })
            })
        );
    };

    // Announce immediately
    announceProvider();

    // Listen for discovery requests
    window.addEventListener('eip6963:requestProvider', () => {
        announceProvider();
    });

    // Dispatch legacy events
    window.dispatchEvent(new Event('ethereum#initialized'));
    
    console.log('[Iframe] ✅ Proxy wallet provider injected successfully');
})();
        `;
    };

    return (
        <div className={`mini-app-modal ${isAppCollapsed ? 'collapsed' : ''}`}>
            <div className="modal-header">
                <div className="modal-title">
                    <span className="app-icon">
                        {miniApp.icon.includes('/') || miniApp.icon.includes('.') ? (
                            <img src={miniApp.icon} alt={miniApp.name} className="app-icon-img" />
                        ) : (
                            miniApp.icon
                        )}
                    </span>
                    <span className="app-name">{miniApp.name}</span>
                </div>
                <div className="modal-controls">
                    <div className={`url-input-container ${isUrlInputVisible ? '' : 'hidden'}`}>
                        <input
                            type="text"
                            placeholder="https://..."
                            className="url-input"
                            value={urlInputValue}
                            onChange={(e) => setUrlInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUrlSubmit();
                                if (e.key === 'Escape') setIsUrlInputVisible(false);
                            }}
                            autoFocus
                        />
                    </div>

                    {/* Toggle URL Input */}
                    <button onClick={() => setIsUrlInputVisible(!isUrlInputVisible)} className="icon-btn" aria-label="Enter URL" id="toggle-url-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </button>

                    {/* Expand / Collapse */}
                    <button onClick={() => setIsAppCollapsed(!isAppCollapsed)} className="icon-btn" aria-label="Expand">
                        {isAppCollapsed ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="18 15 12 9 6 15"></polyline>
                            </svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        )}
                    </button>

                    {/* Refresh */}
                    <button onClick={handleRefresh} className="icon-btn" aria-label="Refresh">
                        <svg id="refresh-btn-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 4v6h-6"></path>
                            <path d="M1 20v-6h6"></path>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                        </svg>
                    </button>

                    {/* Close (Clear App) */}
                    <button onClick={() => {
                        setMiniApp({
                            name: 'myApp',
                            icon: '/mini-app-model/myApp.svg',
                            url: ''
                        });
                        setIsUrlInputVisible(false);
                    }} className="icon-btn" aria-label="Close">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>

            <div className="modal-body">
                {/* Empty State */}
                {(!miniApp.url || miniApp.url === 'about:blank') && (
                    <div className="empty-state">
                        <img src="/mini-app-model/myApp.svg" alt="FramerIDE" className="empty-state-logo" />
                    </div>
                )}

                {/* Loading State */}
                <div className={`loading-state ${isAppLoading ? '' : 'hidden'}`}>
                    <div className="spinner"></div>
                </div>

                {/* Iframe */}
                <iframe
                    ref={iframeRef}
                    id="app-frame"
                    src={miniApp.url}
                    title="Mini App"
                    className={isAppLoading || !miniApp.url ? 'hidden' : ''}
                    onLoad={handleIframeLoad}
                    allow="clipboard-read *; clipboard-write *; web-share *; camera *; microphone *; geolocation *"
                ></iframe>
            </div>
        </div>
    );
}
