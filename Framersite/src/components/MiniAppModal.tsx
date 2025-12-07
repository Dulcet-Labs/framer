import { useRef, useState } from 'react';

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
