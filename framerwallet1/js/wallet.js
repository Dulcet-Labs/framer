function openSendSheet() {
    document.getElementById('sheet-send').classList.add('active');
}

let html5QrCode;

function openReceiveSheet() {
    document.getElementById('sheet-receive').classList.add('active');
}

function openScan() {
    document.getElementById('sheet-scan').classList.add('active');

    // Initialize Scanner if not already
    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("qr-reader");
    }

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    // Start Camera
    html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess)
        .catch(err => {
            console.error("Error starting scanner", err);
            alert("Camera access failed. Please ensure you have granted permission.");
        });
}

function onScanSuccess(decodedText, decodedResult) {
    // Handle the scanned code
    console.log(`Scan result: ${decodedText}`, decodedResult);

    // Stop scanner
    closeSheets();

    // Simple alert for now, or populate send field
    alert(`Scanned: ${decodedText}`);

    // Optional: If it's an address, open send sheet
    if (decodedText.startsWith('0x') || decodedText.length === 42) {
        // openSendSheet(decodedText); // Future implementation
    }
}

function closeSheets() {
    document.querySelectorAll('.sheet-overlay').forEach(el => el.classList.remove('active'));

    // Stop scanner if running
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
            console.log("Scanner stopped");
        }).catch(err => {
            console.warn("Error stopping scanner", err);
        });
    }
}

// Close on click outside
document.querySelectorAll('.sheet-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeSheets();
        }
    });
});

// Onboarding Logic
function checkAuthState() {
    const isOnboarded = localStorage.getItem('isOnboarded');
    const isExplicitLogout = localStorage.getItem('isExplicitLogout');

    if (!isOnboarded) {
        openOnboarding();
    } else if (isExplicitLogout === 'true') {
        openWelcomeBack();
    }
}

function openWelcomeBack() {
    document.getElementById('onboarding').classList.add('active');
    // Hide all cards
    document.querySelectorAll('.onboarding-card').forEach(el => el.classList.remove('active'));
    // Show welcome back card
    const wb = document.getElementById('step-welcome-back');
    if (wb) wb.classList.add('active');
}

function openOnboarding() {
    document.getElementById('onboarding').classList.add('active');
}

function nextStep(step) {
    // Hide all cards
    document.querySelectorAll('.onboarding-card').forEach(el => el.classList.remove('active'));

    // Show target card
    document.getElementById(`step-${step}`).classList.add('active');
}

async function finishOnboarding() {
    const btn = document.querySelector('#step-3 .btn');
    const originalText = btn.textContent;

    // Loading State
    btn.textContent = 'Creating Wallet...';
    btn.disabled = true;
    btn.style.opacity = '0.7';

    try {
        // Wait for successful connection
        const address = await connectWallet();

        if (address) {
            // Success: Close modal and save state
            document.getElementById('onboarding').classList.remove('active');
            document.documentElement.classList.remove('show-onboarding');
            localStorage.setItem('isOnboarded', 'true');
        }
    } catch (error) {
        // Error: Reset button
        console.error('Onboarding failed:', error);
        btn.textContent = 'Try Again';
        btn.disabled = false;
        btn.style.opacity = '1';
    }
}

// Base Wallet Logic
const APP_NAME = 'Framer Wallet';
// IMPORTANT: This must be a public URL so the Wallet can fetch it. Localhost won't work for external peers.
const APP_LOGO_URL = 'https://avatars.githubusercontent.com/u/10855319?s=200&v=4'; // Coinbase/Base Logo
const CHAIN_ID = 8453; // Base Mainnet

let sdk = null;
let provider = null;

// UI Logger for debugging
function logToUI(message, isError = false) {
    console.log(message);
    // Debug overlay disabled for production feel
    /*
    // Create log container if it doesn't exist
    let logContainer = document.getElementById('debug-log');
    if (!logContainer) {
        logContainer = document.createElement('div');
        logContainer.id = 'debug-log';
        logContainer.style.position = 'fixed';
        logContainer.style.bottom = '0';
        logContainer.style.left = '0';
        logContainer.style.right = '0';
        logContainer.style.background = 'rgba(0,0,0,0.8)';
        logContainer.style.color = '#0f0';
        logContainer.style.fontSize = '10px';
        logContainer.style.padding = '4px';
        logContainer.style.zIndex = '9999';
        logContainer.style.fontFamily = 'monospace';
        logContainer.style.maxHeight = '100px';
        logContainer.style.overflowY = 'auto';
        document.body.appendChild(logContainer);
    }
    const line = document.createElement('div');
    line.textContent = `> ${message}`;
    if (isError) line.style.color = '#ff5555';
    logContainer.prepend(line);
    */
}

// ... (rest of code)

function copyAddress() {
    const fullAddress = document.getElementById('receive-address-full').value;
    const displayDiv = document.getElementById('receive-address-display');

    if (!fullAddress) return;

    navigator.clipboard.writeText(fullAddress).then(() => {
        // Visual feedback
        const originalText = displayDiv.textContent;

        displayDiv.textContent = 'Copied!';
        displayDiv.style.color = 'var(--color-primary)'; // Optional: make it green/primary color

        setTimeout(() => {
            displayDiv.textContent = originalText;
            displayDiv.style.color = 'var(--color-text-primary)';
        }, 2000);

        // logToUI('Address copied!');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        // logToUI('Failed to copy address', true);
    });
}

async function loginFromWelcome() {
    const btn = document.querySelector('#step-welcome-back .btn');
    const originalText = btn ? btn.textContent : 'Log In';
    if (btn) btn.textContent = 'Connecting...';

    try {
        await connectWallet();
        // On success:
        document.getElementById('onboarding').classList.remove('active');
        document.documentElement.classList.remove('show-welcome-back');
        localStorage.removeItem('isExplicitLogout');
        if (btn) btn.textContent = originalText;
    } catch (e) {
        console.error("Login failed", e);
        if (btn) {
            btn.textContent = 'Try Again';
            setTimeout(() => btn.textContent = originalText, 2000);
        }
    }
}

function initBaseWallet() {
    // Check onboarding status first (Moved to global scope to prevent flash)
    // checkOnboarding();

    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    if (typeof window.createBaseAccountSDK === 'undefined') {
        const msg = 'Base Account SDK not loaded (window.createBaseAccountSDK is undefined)';
        console.error(msg);
        // logToUI(msg, 'error'); // Debugger disabled
        return;
    }

    try {
        sdk = window.createBaseAccountSDK({
            appName: APP_NAME,
            appLogoUrl: APP_LOGO_URL,
            appChainIds: [CHAIN_ID],
            preference: {
                telemetry: false
            }
        });

        provider = sdk.getProvider();

        // Auto-login ONLY if onboarded AND NOT explicitly logged out
        if (localStorage.getItem('isOnboarded') === 'true' && localStorage.getItem('isExplicitLogout') !== 'true') {
            connectWallet(true);
        }

    } catch (error) {
        const msg = 'Error initializing Base Wallet SDK: ' + error.message;
        console.error(msg);
        // logToUI(msg, 'error'); // Debugger disabled
    }
}

async function connectWallet(silent = false) {
    logToUI('Starting wallet connection...');

    // Ensure SDK is initialized
    if (!provider) {
        logToUI('Provider not found, initializing...');
        initBaseWallet();
    }

    if (!provider) {
        logToUI('Failed to initialize provider', true);
        throw new Error('Wallet provider could not be initialized');
    }

    try {
        logToUI('Requesting accounts...');

        // Attempt connection (No timeout)
        const accounts = await provider.request({
            method: 'eth_requestAccounts'
        });

        if (!accounts || accounts.length === 0) {
            throw new Error('No accounts returned');
        }

        const userAddress = accounts[0];
        logToUI(`Connected: ${userAddress}`);

        // Update UI
        await updateUI(userAddress);

        return userAddress; // Return address on success

    } catch (error) {
        logToUI(`Connection failed: ${error.message}`, true);
        console.error('Connection failed details:', error);

        // Only alert if this was an explicit user action (not silent)
        if (!silent) {
            // Fallback: If it's a popup blocker or iframe issue, try alerting the user
            if (error.message && (error.message.includes('User denied') || error.message.includes('Rejected'))) {
                alert('Please approve the connection request in the popup window.');
            } else {
                alert('Connection failed. Please check the console for details.');
            }
        }

        throw error; // Throw error to handle in caller
    }
}

async function updateUI(address) {
    // Hide Profile Button, Show Avatar
    document.getElementById('btn-profile').classList.add('hidden');
    const avatar = document.getElementById('user-avatar');
    avatar.textContent = ''; // No text, just the block/image

    // Optional: Generate a gradient or unique color based on address for the avatar
    // avatar.style.background = generateGradient(address); 

    avatar.classList.remove('hidden');

    // Update Receive Sheet
    document.getElementById('receive-address-full').value = address;
    document.getElementById('receive-address-display').textContent = address.slice(0, 6) + '...' + address.slice(-4);

    // Generate QR Code
    const qrContainer = document.getElementById('receive-qr');
    qrContainer.innerHTML = ''; // Clear previous
    new QRCode(qrContainer, {
        text: address,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    // Re-render icons for the new copy button
    lucide.createIcons();

    // Fetch Real Data
    await fetchBalances(address);
}

function copyAddress() {
    const fullAddress = document.getElementById('receive-address-full').value;

    if (!fullAddress) return;

    navigator.clipboard.writeText(fullAddress).then(() => {
        // Visual feedback
        const btn = document.querySelector('#receive-address-display + button');

        // Change to text
        btn.textContent = 'Copied!';
        btn.classList.add('btn-success');

        setTimeout(() => {
            btn.textContent = 'Copy';
            btn.classList.remove('btn-success');
        }, 2000);

        logToUI('Address copied!');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        logToUI('Failed to copy address', true);
    });
}

async function fetchBalances(address) {
    // RPC Endpoint (Base Mainnet)
    const RPC_URL = 'https://mainnet.base.org';

    // 1. Fetch ETH Balance
    try {
        const response = await fetch(RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getBalance',
                params: [address, 'latest'],
                id: 1
            })
        });

        const data = await response.json();
        const hexBalance = data.result;
        const ethBalance = parseInt(hexBalance, 16) / 1e18;

        // 2. Fetch ETH Price (Coinbase Public API)
        let ethPrice = 0;
        try {
            const priceReq = await fetch('https://api.coinbase.com/v2/prices/ETH-USD/spot');
            const priceData = await priceReq.json();
            ethPrice = parseFloat(priceData.data.amount);
        } catch (e) {
            console.error('Error fetching price:', e);
            ethPrice = 3500; // Fallback
        }

        const totalUsdValue = ethBalance * ethPrice;

        // Update Total Balance Card (USD)
        document.querySelector('.balance-amount').textContent = `$${totalUsdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.querySelector('.balance-label').textContent = 'Total Balance';

        // Update Asset List
        const assetList = document.getElementById('asset-list');
        assetList.innerHTML = ''; // Clear placeholder

        // USDC Item (Mocked for now as we need ABI to fetch token balance)
        // User asked to "change the balance too USDC", so we highlight it.
        const usdcItem = document.createElement('div');
        usdcItem.className = 'list-item';
        usdcItem.innerHTML = `
            <div style="display: flex; gap: 12px; align-items: center;">
                <div class="token-icon" style="background: #2775CA; color: white;">$</div>
                <div class="list-item-content">
                    <div class="list-item-title">USDC</div>
                    <div class="list-item-subtitle">USD Coin</div>
                </div>
            </div>
            <div style="text-align: right;">
                <div class="list-item-title">$0.00</div>
                <div class="list-item-subtitle">0.00 USDC</div>
            </div>
        `;
        assetList.appendChild(usdcItem);

        // ETH Item
        const ethItem = document.createElement('div');
        ethItem.className = 'list-item';
        ethItem.innerHTML = `
            <div style="display: flex; gap: 12px; align-items: center;">
                <div class="token-icon" style="background: #0052FF; color: white;">E</div>
                <div class="list-item-content">
                    <div class="list-item-title">Ethereum</div>
                    <div class="list-item-subtitle">Base</div>
                </div>
            </div>
            <div style="text-align: right;">
                <div class="list-item-title">${ethBalance.toFixed(4)} ETH</div>
                <div class="list-item-subtitle">$${(ethBalance * ethPrice).toFixed(2)}</div>
            </div>
        `;
        assetList.appendChild(ethItem);

    } catch (error) {
        console.error('Error fetching balance:', error);
    }
}

// Pull to Refresh Logic
function initPullToRefresh() {
    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    const triggerThreshold = 100; // Increased visual offset needed to trigger refresh
    const dragStartThreshold = 80; // Increased deadzone: ignore first 80px of drag
    const spinner = document.getElementById('ptr-spinner');
    const mainContent = document.querySelector('main'); // Or body

    window.addEventListener('touchstart', (e) => {
        if (window.scrollY <= 0) {
            startY = e.touches[0].clientY;
            isDragging = true;
        }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (!isDragging) return;

        currentY = e.touches[0].clientY;
        const diff = currentY - startY;

        // Only pull if at top, pulling down, AND passed the start threshold
        if (diff > dragStartThreshold && window.scrollY <= 0) {

            // Calculate effective pull (starting from 0 after threshold)
            const effectiveDiff = diff - dragStartThreshold;

            // Resistance effect
            const move = Math.min(effectiveDiff * 0.5, 150);

            // Position spinner below header (64px)
            spinner.style.top = `${(move * 0.6) + 10}px`;

            // Pull main content down
            mainContent.style.transform = `translateY(${move}px)`;
            mainContent.style.transition = 'none';
        }
    }, { passive: true });

    window.addEventListener('touchend', async (e) => {
        if (!isDragging) return;
        isDragging = false;

        const diff = currentY - startY;
        const effectiveDiff = diff - dragStartThreshold;
        const move = effectiveDiff * 0.5;

        // Restore transition for smooth snap back
        mainContent.style.transition = 'transform 0.3s ease';

        // Trigger only if we passed the start threshold AND the visual trigger threshold
        if (diff > dragStartThreshold && move > triggerThreshold && window.scrollY <= 0) {
            // Trigger Refresh
            spinner.style.top = '80px'; // Snap to visible below header
            mainContent.style.transform = 'translateY(70px)'; // Keep content down

            // Haptic feedback if available
            if (navigator.vibrate) navigator.vibrate(10);

            await refreshData();

            // Reset
            setTimeout(() => {
                spinner.style.top = '-50px';
                mainContent.style.transform = 'translateY(0)';
            }, 500);
        } else {
            // Snap back
            spinner.style.top = '-50px';
            mainContent.style.transform = 'translateY(0)';
        }

        // Reset vars
        startY = 0;
        currentY = 0;
    });
}

async function refreshData() {
    console.log('Refreshing data...');

    // Re-fetch balances if connected
    if (provider) {
        try {
            const accounts = await provider.request({ method: 'eth_accounts' });
            if (accounts && accounts.length > 0) {
                await updateUI(accounts[0]);
            }
        } catch (e) {
            console.error('Refresh failed', e);
        }
    } else {
        // Just try init again
        initBaseWallet();
    }
}

// Initialize on load
window.addEventListener('load', () => {
    initBaseWallet();
    initPullToRefresh();
});

// Run onboarding check immediately to prevent flash
checkAuthState();
