import {
    ConnectWallet,
    Wallet,
    WalletDropdown,
    WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import {
    Address,
    Avatar,
    Name,
    Identity,
    EthBalance,
} from '@coinbase/onchainkit/identity';

import { useEffect, useState } from 'react';

export function BottomBar() {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    // Sync theme for logo (simplified check as global theme is managed by ThemeToggle)
    useEffect(() => {
        const updateTheme = () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            setTheme(currentTheme === 'dark' ? 'dark' : 'light');
        };

        // Initial check
        updateTheme();

        // Observer for html attribute changes
        const observer = new MutationObserver(updateTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        return () => observer.disconnect();
    }, []);

    return (
        <div style={{
            position: 'fixed',
            bottom: '2rem',
            left: 0,
            width: '100%',
            height: '0px', // collapsed height to avoid blocking
            zIndex: 100,
            pointerEvents: 'none'
        }}>
            {/* Centered "Building on Base" */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                pointerEvents: 'auto'
            }}>
                <span className="base-text" style={{ fontSize: '1rem', fontWeight: 600 }}>Building on</span>
                <img
                    src={theme === 'dark' ? '/mini-app-model/Base_lockup_white.svg' : '/mini-app-model/Base_lockup_2color.svg'}
                    alt="Base"
                    className="base-logo"
                    style={{ height: '20px' }}
                />
            </div>

            {/* Bottom Left "Connect Wallet" */}
            <div className="dev-account-connect" style={{
                position: 'absolute',
                bottom: 0,
                left: '2rem',
                pointerEvents: 'auto'
            }}>
                <Wallet>
                    <ConnectWallet className="wallet-conn-btn">
                        <Avatar className="h-6 w-6" />
                        <Name className="text-sm font-medium" />
                    </ConnectWallet>
                    <WalletDropdown>
                        <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                            <Avatar className="h-6 w-6" />
                            <Name className="text-sm font-medium" />
                            <Address className="text-sm font-medium text-gray-500 dark:text-gray-400" />
                            <EthBalance className="text-sm font-medium" />
                        </Identity>
                        <WalletDropdownDisconnect />
                    </WalletDropdown>
                </Wallet>
            </div>
        </div>
    );
}
