# On-Screen Debugger Implementation Guide

This guide explains how to implement a lightweight, on-screen debugger for web applications. This is particularly useful for debugging mobile web apps, PWAs, or embedded webviews where access to the browser's native DevTools console is difficult or impossible.

## Overview

The on-screen debugger is a simple JavaScript function that intercepts log messages and displays them in a semi-transparent overlay fixed to the bottom of the screen.

### Features
- **Automatic Injection**: No need to add HTML markup manually; the script creates the container if it doesn't exist.
- **Error Highlighting**: Displays errors in red for quick visibility.
- **Scrollable History**: Keeps a history of logs in a scrollable view.
- **Non-blocking**: Overlays content without breaking the layout.

## Implementation

Add the following function to your main JavaScript file (e.g., `js/wallet.js` or `app.js`).

### The `logToUI` Function

```javascript
/**
 * Logs messages to an on-screen debug console.
 * Useful for mobile/webview debugging where DevTools are unavailable.
 * 
 * @param {string} message - The message to display.
 * @param {boolean} isError - If true, displays the message in red.
 */
function logToUI(message, isError = false) {
    // 1. Always log to the real console as well
    console.log(message);

    // 2. Find or create the debug container
    let logContainer = document.getElementById('debug-log');
    
    if (!logContainer) {
        logContainer = document.createElement('div');
        logContainer.id = 'debug-log';
        
        // Apply styles programmatically to avoid needing external CSS
        Object.assign(logContainer.style, {
            position: 'fixed',
            bottom: '0',
            left: '0',
            right: '0',
            background: 'rgba(0, 0, 0, 0.85)', // Dark semi-transparent background
            color: '#00ff00',                  // Matrix green text
            fontSize: '11px',
            padding: '8px',
            zIndex: '9999',                    // Ensure it sits on top of everything
            fontFamily: 'Menlo, Consolas, monospace',
            maxHeight: '150px',                // Limit height
            overflowY: 'auto',                 // Allow scrolling
            pointerEvents: 'none',             // Let clicks pass through (optional, remove if you want to select text)
            borderTop: '1px solid #333',
            backdropFilter: 'blur(4px)'
        });

        document.body.appendChild(logContainer);
    }

    // 3. Create the log entry
    const line = document.createElement('div');
    line.textContent = `> ${message}`;
    line.style.marginBottom = '2px';
    line.style.wordBreak = 'break-all'; // Wrap long text

    // 4. Style errors differently
    if (isError) {
        line.style.color = '#ff5555';
        line.style.fontWeight = 'bold';
    }

    // 5. Add to container (prepend to see newest at top, append for standard log feel)
    logContainer.prepend(line); 
}
```

## How to Use

Simply replace or augment your `console.log` calls with `logToUI`.

### Basic Logging
```javascript
logToUI('App initialized successfully');
logToUI('User connected: 0x123...abc');
```

### Error Logging
Pass `true` as the second argument to highlight the message as an error.

```javascript
try {
    await connectWallet();
} catch (error) {
    logToUI('Connection failed: ' + error.message, true);
}
```

### Global Error Catching (Optional)
You can automatically catch unhandled errors and show them on screen:

```javascript
window.onerror = function(message, source, lineno, colno, error) {
    logToUI(`Global Error: ${message} at ${source}:${lineno}`, true);
};
```

## Customization

You can tweak the styles in the `Object.assign` block to fit your needs:
- **Position**: Change `bottom: 0` to `top: 0` to move it to the top.
- **Height**: Adjust `maxHeight` to show more or less history.
- **Interactivity**: Remove `pointerEvents: 'none'` if you want to be able to copy/paste logs from the screen.
