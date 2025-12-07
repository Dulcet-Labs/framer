// Script for mini-app-model

document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    // Function to update logo based on theme
    const updateLogo = (theme) => {
        const baseLogo = document.querySelector('.base-logo');
        if (baseLogo) {
            if (theme === 'dark') {
                baseLogo.src = 'mini-app-model/Base_lockup_white.svg';
            } else {
                baseLogo.src = 'mini-app-model/Base_lockup_2color.svg';
            }
        }
    };

    // Icons
    const moonIcon = '<svg class="theme-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
    const sunIcon = '<svg class="theme-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';

    // Check for saved user preference, if any, on load of the website
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme == 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = sunIcon;
        updateLogo('dark');
    } else if (currentTheme == 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        themeToggle.innerHTML = moonIcon;
        updateLogo('light');
    } else if (prefersDarkScheme.matches) {
        updateLogo('dark');
    } else {
        updateLogo('light');
    }

    // Listen for a click on the button
    themeToggle.addEventListener('click', function () {
        let theme = 'light';
        if (document.documentElement.getAttribute('data-theme') === 'light') {
            theme = 'dark';
            themeToggle.innerHTML = sunIcon;
        } else if (document.documentElement.getAttribute('data-theme') === 'dark') {
            theme = 'light';
            themeToggle.innerHTML = moonIcon;
        } else if (prefersDarkScheme.matches) {
            // If no manual override, and system is dark, switch to light
            theme = 'light';
            themeToggle.innerHTML = moonIcon;
        } else {
            // If no manual override, and system is light, switch to dark
            theme = 'dark';
            themeToggle.innerHTML = sunIcon;
        }

        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        updateLogo(theme);
    });

    // Modal Controls
    const modal = document.getElementById('mini-app-modal');
    const expandBtn = document.querySelector('.icon-btn[aria-label="Expand"]');
    const refreshBtn = document.querySelector('.icon-btn[aria-label="Refresh"]');
    const closeBtn = document.querySelector('.icon-btn[aria-label="Close"]');
    let isCollapsed = true; // Default state is collapsed

    function toggleModal() {
        isCollapsed = !isCollapsed;
        if (isCollapsed) {
            // Collapse
            modal.classList.add('collapsed');
            // Update expand button icon to "Up" arrow (meaning "Click to Expand")
            if (expandBtn) expandBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>';
        } else {
            // Expand
            modal.classList.remove('collapsed');
            // Update expand button icon to "Down" arrow (meaning "Click to Collapse")
            if (expandBtn) expandBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';
        }
    }

    if (expandBtn) {
        expandBtn.addEventListener('click', () => {
            toggleModal();
        });
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            // Rotate icon
            const svg = refreshBtn.querySelector('svg');
            svg.style.transition = 'transform 0.5s ease';
            svg.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                svg.style.transition = 'none';
                svg.style.transform = 'rotate(0deg)';
            }, 500);

            // Reload iframe if it has a source
            const appFrame = document.getElementById('app-frame');
            if (appFrame && appFrame.src && appFrame.src !== 'about:blank') {
                // Show loading state again
                const loadingState = document.getElementById('loading-state');
                if (loadingState) loadingState.classList.remove('hidden');
                appFrame.classList.add('hidden');

                // Reload
                appFrame.src = appFrame.src;
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            // "Close" means collapse/minimize to the bottom
            if (!modal.classList.contains('collapsed')) {
                // If expanded, collapse it
                toggleModal();
            }
        });
    }

    // Waitlist Modal Logic
    const waitlistModal = document.getElementById('waitlist-modal');
    const closeModalBtn = document.querySelector('.close-modal-btn');
    const waitlistForm = document.getElementById('waitlist-form');

    window.handleButtonClick = function () {
        waitlistModal.classList.add('active');
    }

    closeModalBtn.addEventListener('click', () => {
        waitlistModal.classList.remove('active');
    });

    // Close on click outside
    waitlistModal.addEventListener('click', (e) => {
        if (e.target === waitlistModal) {
            waitlistModal.classList.remove('active');
        }
    });

    waitlistForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const emailInput = waitlistForm.querySelector('input[type="email"]');
        const email = emailInput.value;
        const btn = waitlistForm.querySelector('button');
        const originalText = btn.textContent;

        btn.textContent = 'Joining...';
        btn.disabled = true;

        setTimeout(() => {
            // Simulate error if email contains 'error'
            if (email.includes('error')) {
                btn.textContent = originalText;
                btn.disabled = false;
                showToast('Something went wrong. Please try again.', 'error');
                return;
            }

            btn.textContent = 'Joined! 🚀';
            waitlistModal.classList.remove('active');

            // Trigger Confetti from sides
            triggerSideConfetti();

            // Show Success Toast
            showToast('Successfully joined the waitlist!', 'success');

            // Reset form
            setTimeout(() => {
                waitlistForm.reset();
                btn.textContent = originalText;
                btn.disabled = false;
            }, 500);
        }, 1000);
    });

    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = toast.querySelector('.toast-message');
        const toastIcon = toast.querySelector('.toast-icon');

        toastMessage.textContent = message;

        // Reset classes
        toast.className = 'toast';

        if (type === 'error') {
            toast.classList.add('error');
            toastIcon.textContent = '⚠️';
        } else {
            toastIcon.textContent = '✨';
        }

        // Trigger reflow to enable transition
        void toast.offsetWidth;

        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    function triggerSideConfetti() {
        const duration = 3000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 0.8 }, // Bottom left
                colors: ['#007aff', '#ffffff', '#f2f2f7']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 0.8 }, // Bottom right
                colors: ['#007aff', '#ffffff', '#f2f2f7']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }

    // Dynamic App Loading
    window.loadMiniApp = function (config) {
        const { name, icon, url } = config;
        const appNameEl = document.getElementById('app-name');
        const appIconEl = document.getElementById('app-icon');
        const appFrame = document.getElementById('app-frame');
        const emptyState = document.getElementById('empty-state');
        const loadingState = document.getElementById('loading-state');

        if (appNameEl) appNameEl.textContent = name;

        if (appIconEl) {
            // Check if icon is an image path (simple check for extension)
            if (icon.includes('.') || icon.includes('/')) {
                appIconEl.innerHTML = `<img src="${icon}" alt="${name}" class="app-icon-img">`;
            } else {
                appIconEl.textContent = icon;
            }
        }

        if (appFrame) {
            if (url && url !== 'about:blank') {
                // Show loading state
                if (loadingState) loadingState.classList.remove('hidden');
                if (emptyState) emptyState.style.display = 'none';
                appFrame.classList.add('hidden');

                appFrame.src = url;

                // When iframe loads, hide loading and show frame
                appFrame.onload = () => {
                    if (loadingState) loadingState.classList.add('hidden');
                    appFrame.classList.remove('hidden');

                    // BRIDGE: Inject Ethereum Provider into Iframe
                    // This is required because extensions often don't inject into iframes.
                    // We listen for messages from the iframe and proxy them to the main window.ethereum
                    try {
                        const win = appFrame.contentWindow;

                        // 1. Inject a script into the iframe to create a proxy window.ethereum
                        // Note: This only works for same-origin iframes (like our local demo-app.html)
                        // For cross-origin, we'd need postMessage communication on both sides.

                        // Check if same-origin
                        const isSameOrigin = appFrame.contentWindow.location.origin === window.location.origin;

                        if (isSameOrigin && window.ethereum) {
                            console.log("Injecting Wallet Provider into Iframe...");
                            win.ethereum = window.ethereum;
                            console.log("Injection successful!");
                        } else {
                            console.warn("Cannot inject wallet provider: Cross-origin or no wallet found.");
                        }
                    } catch (e) {
                        console.warn("Bridge failed:", e);
                    }
                };

                // Handle load errors (limited for iframes, but we can try a timeout fallback)
                // If it takes too long (e.g. 5s), assume it might be blocked or slow
                setTimeout(() => {
                    if (!appFrame.classList.contains('hidden') && loadingState && !loadingState.classList.contains('hidden')) {
                        // Still loading? It might be blocked by X-Frame-Options.
                        // We can't detect X-Frame-Options error directly in JS due to security.
                        // But we can show a toast hint.
                        if (loadingState) loadingState.classList.add('hidden');
                        appFrame.classList.remove('hidden'); // Show whatever loaded (maybe error page)
                        showToast('If the app doesn\'t load, it might be blocked by the site.', 'error');
                    }
                }, 5000);

            } else {
                appFrame.src = 'about:blank';
                appFrame.classList.add('hidden');
                if (loadingState) loadingState.classList.add('hidden');
                if (emptyState) emptyState.style.display = 'flex';
            }
        }
    };

    // Initialize with default app
    loadMiniApp({
        name: 'Wallet Demo',
        icon: 'mini-app-model/myApp.svg',
        url: 'mini-app-model/demo-app.html'
    });

    // URL Input Logic
    const toggleUrlBtn = document.getElementById('toggle-url-btn');
    const urlInputContainer = document.getElementById('url-input-container');
    const urlInput = document.getElementById('app-url-input');

    if (toggleUrlBtn && urlInputContainer && urlInput) {
        toggleUrlBtn.addEventListener('click', () => {
            urlInputContainer.classList.toggle('hidden');
            if (!urlInputContainer.classList.contains('hidden')) {
                urlInput.focus();
            }
        });

        urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                let url = urlInput.value.trim();
                if (url) {
                    // Add https if missing
                    if (!url.startsWith('http://') && !url.startsWith('https://')) {
                        url = 'https://' + url;
                    }

                    // Try to fetch metadata (Note: This is limited by CORS in a real browser environment without a proxy)
                    // We'll simulate a "best effort" or use a simple trick if possible, 
                    // but for a static local file, we can't easily scrape external sites due to CORS.
                    // However, we can set the name/icon to generic "Loading..." then update if possible.
                    // For now, we'll use the domain as the name.

                    let domain = url;
                    try {
                        const urlObj = new URL(url);
                        domain = urlObj.hostname;
                    } catch (e) {
                        console.error("Invalid URL");
                    }

                    loadMiniApp({
                        name: domain, // Use domain as temporary name
                        icon: `https://www.google.com/s2/favicons?domain=${url}&sz=64`, // Google Favicon Service
                        url: url
                    });

                    urlInputContainer.classList.add('hidden');
                    urlInput.value = ''; // Clear input
                }
            } else if (e.key === 'Escape') {
                urlInputContainer.classList.add('hidden');
            }
        });

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (!urlInputContainer.contains(e.target) && !toggleUrlBtn.contains(e.target)) {
                urlInputContainer.classList.add('hidden');
            }
        });
    }
});
