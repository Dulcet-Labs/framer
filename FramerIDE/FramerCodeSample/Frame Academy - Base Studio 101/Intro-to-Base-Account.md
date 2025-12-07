# 🔵 Base Studio 101: Build Your First Crypto Wallet

Welcome to **Frame Academy**. 🎓

## 1. The Big Picture 🖼️

### 🍿 The Vibe (ELI15)
Imagine you want to build a clubhouse (your app). Usually, to let people in, you have to give them a heavy metal key (Private Key) that they have to guard with their life. If they lose it, they lose their house. Stressful, right?

**Base Account** is like upgrading that lock to a fingerprint scanner or FaceID. Your users just walk up, scan their face, and boom—they're in. No heavy keys to lose. It's crypto without the panic attacks.

### 💻 The Tech (Dev Mode)
We are implementing **Smart Wallets** using the **Base Account SDK**. This abstracts away the complexity of EOAs (Externally Owned Accounts) and Seed Phrases. Instead, it uses **Passkeys** (WebAuthn standard) to sign transactions securely using the device's secure enclave.

---

## 2. The One "Gotcha" (Localhost vs. Public) ⚠️

### 🍿 The Vibe (ELI15)
Base Account is kinda shy. It doesn't like talking to "Localhost" (which is just your computer talking to itself). It thinks it's a stranger in a van. It only trusts "Public" websites that look official.

So, if you try to run this just on your laptop, it will ignore you. We need to give your laptop a fake ID so it looks like a real website. That's what **ngrok** does.

### 💻 The Tech (Dev Mode)
The Base Account SDK enforces security policies that often block `http://localhost` or `file://` protocols to prevent phishing or insecure connections. To test locally, we must tunnel our local server to a public HTTPS URL. We will use `ngrok` to forward port 3000 to a public domain.

---

## Step 1: The Skeleton (HTML) 🦴

### 🍿 The Vibe (ELI15)
This is just the body of the car. It doesn't move yet, and the engine isn't running, but we need a frame to hold everything together. We're just putting a "Connect" button on a blank page.

### 💻 The Tech (Dev Mode)
We need a standard HTML5 boilerplate. Crucially, we must import the **Base Account SDK** via a CDN script tag in the `<head>`. This exposes the `window.createBaseAccountSDK` function we'll use later.

**`index.html`**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My First Base Wallet</title>
    
    <!-- Import the Base Account SDK -->
    <script src="https://unpkg.com/@base-org/account/dist/base-account.min.js"></script>
    
    <style>
        body { font-family: sans-serif; text-align: center; padding: 50px; }
        button { padding: 10px 20px; font-size: 16px; cursor: pointer; }
        #wallet-info { margin-top: 20px; font-weight: bold; color: #0052FF; }
    </style>
</head>
<body>

    <h1>🚀 My Base Wallet</h1>
    
    <!-- The Connect Button -->
    <button id="connect-btn" onclick="connectWallet()">Connect Wallet</button>
    
    <!-- Where we show the address -->
    <div id="wallet-info"></div>

    <script src="app.js"></script>
</body>
</html>
```

---

## Step 2: The Brains (JavaScript) 🧠

### 🍿 The Vibe (ELI15)
Now we're putting the engine in the car.
1.  **Init**: Turning the key in the ignition. We tell the app "Hey, we're using Base."
2.  **Connect**: Pressing the gas pedal. When the user clicks the button, we ask "Can I see your ID?" (Connect Wallet). If they say yes, we get their name (Address) and write it on the screen.

### 💻 The Tech (Dev Mode)
We will create an `app.js` file to handle the logic.
1.  **Initialization**: We instantiate `createBaseAccountSDK` with our `CHAIN_ID` (8453 for Base Mainnet).
2.  **Provider**: We extract the Ethereum Provider (`sdk.getProvider()`) which mimics the standard EIP-1193 provider API (like MetaMask).
3.  **RPC Call**: We call `eth_requestAccounts` to trigger the connection flow and retrieve the user's wallet address.

**`app.js`**
```javascript
const APP_NAME = 'My Awesome Wallet';
const CHAIN_ID = 8453; // Base Mainnet

let sdk = null;
let provider = null;

// 1. Initialize the SDK
function init() {
    if (typeof window.createBaseAccountSDK === 'undefined') {
        console.error("Base SDK not found!");
        return;
    }

    // Create the SDK instance
    sdk = window.createBaseAccountSDK({
        appName: APP_NAME,
        appChainIds: [CHAIN_ID]
    });

    // Get the provider
    provider = sdk.getProvider();
    console.log("Base Wallet Initialized! 🔵");
}

// 2. The Connect Function
async function connectWallet() {
    if (!provider) init();

    const btn = document.getElementById('connect-btn');
    const display = document.getElementById('wallet-info');

    btn.textContent = "Connecting...";

    try {
        // Trigger the login popup
        const accounts = await provider.request({
            method: 'eth_requestAccounts'
        });

        // Success! Get the first address
        const userAddress = accounts[0];
        
        display.textContent = `Connected: ${userAddress}`;
        btn.style.display = 'none';
        
        console.log("User connected:", userAddress);

    } catch (error) {
        console.error("Connection failed:", error);
        btn.textContent = "Try Again";
    }
}

// Start the engine on load
window.addEventListener('load', init);
```

---

## Step 3: Run It! 🏃‍♂️

### 🍿 The Vibe (ELI15)
Time to take it for a spin! Remember, don't drive in your driveway (localhost), go to the highway (ngrok).

### 💻 The Tech (Dev Mode)
1.  Start your local server: `python3 -m http.server 3000`
2.  Start the tunnel: `ngrok http 3000`
3.  Open the **HTTPS** URL provided by ngrok.
4.  Open the DevTools Console (`Cmd+Option+J`) to see your logs.

---

**Frame Academy - Base Studio 101**
*Built with ❤️ by LiteFrame*
