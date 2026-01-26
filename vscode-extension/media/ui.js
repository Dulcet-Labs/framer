// UI Logic Module

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('mini-app-modal');
    const expandBtn = document.getElementById('toggle-expand-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const toggleUrlBtn = document.getElementById('toggle-url-btn');
    const urlInputContainer = document.getElementById('url-input-container');
    const urlInput = document.getElementById('app-url-input');
    const scaleBtn = document.getElementById('scale-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const closeSheetBtn = document.getElementById('close-sheet-btn');
    const settingsSheet = document.getElementById('settings-sheet');
    const sheetOverlay = document.getElementById('sheet-overlay');

    // State
    window.isCollapsed = true; // Default state

    // Modal Toggle
    window.toggleModal = function () {
        window.isCollapsed = !window.isCollapsed;
        if (window.isCollapsed) {
            modal.classList.add('collapsed');
            // Show Up Arrow to expand
            if (expandBtn) expandBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>';
        } else {
            modal.classList.remove('collapsed');
            // Show Down Arrow to collapse
            if (expandBtn) expandBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';
        }
    };

    if (expandBtn) {
        expandBtn.addEventListener('click', window.toggleModal);
    }

    // Toolbar Actions

    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            const iframe = document.getElementById('app-frame');
            const loadingState = document.getElementById('loading-state');
            const progressContainer = document.getElementById('progress-container');
            const progressBar = document.querySelector('.progress-bar');
            const emptyState = document.getElementById('empty-state');

            if (iframe && iframe.src && iframe.src !== 'about:blank') {
                // Show loading indicators
                if (loadingState) loadingState.classList.remove('hidden');
                if (progressContainer) progressContainer.classList.remove('hidden');
                if (progressBar) progressBar.classList.add('loading');

                // Ensure iframe is visible and empty state is hidden
                iframe.classList.remove('hidden');
                if (emptyState) emptyState.classList.add('hidden');

                // Force reload
                iframe.src = iframe.src;

                // Handle load completion
                iframe.onload = () => {
                    if (loadingState) loadingState.classList.add('hidden');
                    if (progressContainer) progressContainer.classList.add('hidden');
                    if (progressBar) progressBar.classList.remove('loading');
                };
            } else {
                // If no URL set, maybe show empty state or do nothing
                if (emptyState) emptyState.classList.remove('hidden');
                if (iframe) iframe.classList.add('hidden');
                // Stop spinner if it was somehow started
                if (loadingState) loadingState.classList.add('hidden');
            }
        });
    }

    // URL Toggle
    if (toggleUrlBtn && urlInputContainer && urlInput) {
        toggleUrlBtn.addEventListener('click', () => {
            if (urlInputContainer.classList.contains('hidden')) {
                urlInputContainer.classList.remove('hidden');
                urlInput.focus();
            } else {
                urlInputContainer.classList.add('hidden');
            }
        });

        // Close input when clicking outside
        document.addEventListener('click', (e) => {
            if (!urlInputContainer.classList.contains('hidden')) {
                if (!urlInputContainer.contains(e.target) && !toggleUrlBtn.contains(e.target)) {
                    urlInputContainer.classList.add('hidden');
                }
            }
        });
    }



    // Scale Logic
    let currentScale = 0.9;
    const scales = [1, 0.9, 0.8];

    if (scaleBtn) {
        scaleBtn.addEventListener('click', () => {
            const currentIndex = scales.indexOf(currentScale);
            const nextIndex = (currentIndex + 1) % scales.length;
            currentScale = scales[nextIndex];
            modal.style.transform = `scale(${currentScale})`;
        });
    }

    // Sheet Logic
    function toggleSheet(sheetId) {
        const sheet = document.getElementById(sheetId);
        if (sheet) {
            // Close others first if needed
            document.querySelectorAll('.secondary-sheet').forEach(s => {
                if (s.id !== sheetId) s.classList.remove('active');
            });

            sheet.classList.toggle('active');

            // Manage overlay
            const anyActive = document.querySelector('.secondary-sheet.active');
            if (anyActive) {
                if (sheetOverlay) sheetOverlay.classList.add('active');
            } else {
                if (sheetOverlay) sheetOverlay.classList.remove('active');
            }
        }
    }

    // Settings
    if (settingsBtn) settingsBtn.addEventListener('click', () => toggleSheet('settings-sheet'));
    if (closeSheetBtn) closeSheetBtn.addEventListener('click', () => toggleSheet('settings-sheet'));

    // Wallet
    const walletBtn = document.getElementById('wallet-btn');
    const closeWalletBtn = document.getElementById('close-wallet-btn');
    const getStartedBtn = document.getElementById('wallet-get-started-btn');
    const loginPasskeyBtn = document.getElementById('login-passkey-btn');
    const disconnectBtn = document.getElementById('disconnect-btn');

    if (walletBtn) {
        // Disable wallet button for now
        walletBtn.style.opacity = '0.5';
        walletBtn.style.cursor = 'not-allowed';
        // walletBtn.style.textDecoration = 'line-through'; // Removed strike-through on text/icon itself if preferred, or keep it. User asked to change icon back.

        // Remove existing listeners by cloning (simple way) or just blocking click
        const newWalletBtn = walletBtn.cloneNode(true);
        walletBtn.parentNode.replaceChild(newWalletBtn, walletBtn);

        newWalletBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    }

    // Wallet Flow Simulation
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', () => {
            document.getElementById('wallet-welcome-view').classList.add('hidden');
            document.getElementById('wallet-login-view').classList.remove('hidden');
        });
    }

    // Wallet State
    let currentWallet = null;
    let web3Provider = null;

    // Initialize Base Account SDK
    const APP_NAME = 'Framer IDE';
    const APP_LOGO_URL = 'https://avatars.githubusercontent.com/u/10855319?s=200&v=4';
    const DEFAULT_CHAIN_ID = 8453; // Base Mainnet

    let baseSdk = null;

    // Patch fetch to handle Base SDK's COOP check failure in VS Code Webview
    const originalFetch = window.fetch;
    window.fetch = async function (input, init) {
        try {
            const url = input instanceof Request ? input.url : String(input);
            if (url === window.location.href || url.startsWith('vscode-webview://') || url.includes('vscode-cdn.net')) {
                // Mock a successful response for COOP check
                return new Response(null, {
                    status: 200,
                    headers: { 'Cross-Origin-Opener-Policy': 'unsafe-none' }
                });
            }
        } catch (e) {
            // Ignore parsing errors
        }
        return originalFetch(input, init);
    };

    function initWallet() {
        try {
            // Check if createBaseAccountSDK exists on window (loaded from CDN)
            if (typeof window.createBaseAccountSDK === 'undefined') {
                console.error('Base Account SDK not loaded (window.createBaseAccountSDK is undefined)');
                return null;
            }

            if (!baseSdk) {
                baseSdk = window.createBaseAccountSDK({
                    appName: APP_NAME,
                    appLogoUrl: APP_LOGO_URL,
                    appChainIds: [DEFAULT_CHAIN_ID]
                });
            }
            return baseSdk.getProvider();
        } catch (e) {
            console.error('Failed to init wallet:', e);
            return null;
        }
    }

    // Initialize immediately
    web3Provider = initWallet();

    function generateNonce() {
        return window.crypto.randomUUID().replace(/-/g, "");
    }

    // Intercept window.open to handle VS Code popup blocking
    const originalWindowOpen = window.open;
    window.open = function (url, target, features) {
        console.log('Intercepted window.open:', url, target, features);

        try {
            const urlString = url ? String(url) : '';

            // If it's a wallet connection URL, ask VS Code to open it externally
            if (urlString && (urlString.includes('coinbase.com') || urlString.includes('base.org'))) {
                if (window.vscode) {
                    window.vscode.postMessage({ command: 'openExternal', url: urlString });
                    // We return a dummy window object to prevent immediate crash if SDK expects one
                    return {
                        close: () => { },
                        focus: () => { },
                        postMessage: () => { },
                        closed: false
                    };
                }
            }

            return originalWindowOpen.call(window, url, target, features);
        } catch (e) {
            console.error('window.open interceptor failed:', e);
            return null;
        }
    };

    async function connectWallet() {
        if (!web3Provider) {
            web3Provider = initWallet();
        }

        if (!web3Provider) {
            alert('Wallet SDK not loaded. Check internet connection.');
            return;
        }

        try {
            // Generate a fresh nonce
            const nonce = generateNonce();

            // Connect and authenticate using the wallet_connect method
            const { accounts } = await web3Provider.request({
                method: "wallet_connect",
                params: [
                    {
                        version: "1",
                        capabilities: {
                            signInWithEthereum: {
                                nonce,
                                chainId: "0x2105", // Base Mainnet - 8453
                            },
                        },
                    },
                ],
            });

            const address = accounts[0].address;

            // Get Balance
            const balanceHex = await web3Provider.request({
                method: 'eth_getBalance',
                params: [address, 'latest']
            });
            const balanceWei = parseInt(balanceHex, 16);
            const balanceEth = (balanceWei / 1e18).toFixed(4);

            // Get Real ETH Price
            let ethPrice = 0;
            try {
                const priceRes = await fetch('https://api.coinbase.com/v2/prices/ETH-USD/spot');
                const priceJson = await priceRes.json();
                ethPrice = parseFloat(priceJson.data.amount);
            } catch (e) {
                console.error('Failed to fetch price', e);
                ethPrice = 0;
            }

            return {
                address: address,
                balance: balanceEth,
                usd: (balanceEth * ethPrice).toFixed(2)
            };
        } catch (err) {
            console.error('User denied or error:', err);

            // Check for timeout or popup block
            if (err.message && (err.message.includes('Popup window was blocked') || err.message.includes('timed out') || err.message.includes('User denied'))) {
                // Offer simulation
                const useSim = confirm(`Real wallet connection failed (${err.message}).\n\nVS Code Webviews have restrictions that block Passkeys/Popups.\n\nWould you like to use a SIMULATED wallet to test the UI?`);

                if (useSim) {
                    return {
                        address: '0x1234...5678',
                        balance: '1.50',
                        usd: '3500.00'
                    };
                }
            }
            return null;
        }
    }

    function updateWalletUI(wallet) {
        if (!wallet) return;

        const addressEl = document.querySelector('.address-pill');
        const balanceEl = document.querySelector('.balance-display');
        const labelEl = document.querySelector('.balance-label');
        const avatarEl = document.querySelector('.avatar-large');

        if (addressEl) addressEl.textContent = `${wallet.address.substring(0, 6)}...${wallet.address.substring(38)}`;
        if (balanceEl) balanceEl.textContent = `$${wallet.usd}`;
        if (labelEl) labelEl.textContent = `${wallet.balance} ETH`;

        // Generate a deterministic gradient for avatar based on address
        if (avatarEl) {
            const c1 = '#' + wallet.address.substring(2, 8);
            const c2 = '#' + wallet.address.substring(34, 40);
            avatarEl.style.background = `linear-gradient(135deg, ${c1}, ${c2})`;
        }

        // Show profile
        document.getElementById('wallet-welcome-view').classList.add('hidden');
        document.getElementById('wallet-login-view').classList.add('hidden');
        document.getElementById('wallet-scan-view').classList.add('hidden');
        document.getElementById('wallet-profile-view').classList.remove('hidden');
    }

    // Expose for main.js to call on restore
    window.restoreWalletUI = function (wallet) {
        currentWallet = wallet;
        updateWalletUI(wallet);
    };

    if (loginPasskeyBtn) {
        // Remove existing listeners by cloning (simple way without named function)
        const newBtn = loginPasskeyBtn.cloneNode(true);
        loginPasskeyBtn.parentNode.replaceChild(newBtn, loginPasskeyBtn);

        newBtn.addEventListener('click', async () => {
            // 2. Connect Real Wallet
            // We call connectWallet first to ensure the popup is triggered as close to the click as possible
            const wallet = await connectWallet();

            if (wallet) {
                currentWallet = wallet;
                updateWalletUI(currentWallet);

                // Persist
                if (window.vscode) {
                    window.vscode.postMessage({ command: 'saveWallet', wallet: currentWallet });
                }
            } else {
                // Failed or Cancelled - only show error if we didn't get a wallet
                // We don't hide the login view until success to avoid UI flickering if popup is blocked
            }
        });
    }

    // Pay with Base
    const payBtn = document.getElementById('pay-btn');
    if (payBtn) {
        payBtn.addEventListener('click', async () => {
            try {
                // Check if window.base exists (loaded from CDN)
                if (typeof window.base === 'undefined' || typeof window.base.pay === 'undefined') {
                    console.error('Base Pay SDK not loaded');
                    alert('Base Pay SDK not loaded');
                    return;
                }

                const result = await window.base.pay({
                    amount: "1.00", // USD
                    to: "0x2211d1D0020DAEA8039E46Cf1367962070d77DA9", // Demo address
                    testnet: true,
                });

                console.log('Payment result:', result);
                alert('Payment initiated! Check console for details.');

            } catch (error) {
                console.error('Payment failed:', error);

                if (error.message && (error.message.includes('Popup window was blocked') || error.message.includes('timed out'))) {
                    const useSim = confirm(`Real payment failed (${error.message}).\n\nWould you like to SIMULATE a successful payment?`);
                    if (useSim) {
                        alert('🎉 Simulation: Payment of $1.00 USDC completed successfully!');
                        return;
                    }
                }

                alert(`Payment failed: ${error.message}`);
            }
        });
    }

    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', () => {
            currentWallet = null;
            document.getElementById('wallet-profile-view').classList.add('hidden');
            document.getElementById('wallet-welcome-view').classList.remove('hidden');

            // Clear persistence
            if (window.vscode) {
                window.vscode.postMessage({ command: 'saveWallet', wallet: null });
            }
        });
    }

    // Overlay click closes all
    if (sheetOverlay) {
        sheetOverlay.addEventListener('click', () => {
            document.querySelectorAll('.secondary-sheet').forEach(s => s.classList.remove('active'));
            sheetOverlay.classList.remove('active');
        });
    }
});
