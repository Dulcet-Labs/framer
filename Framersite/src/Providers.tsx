import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { base } from 'wagmi/chains';
import { http, createConfig, WagmiProvider } from 'wagmi';
import { coinbaseWallet } from 'wagmi/connectors';
import type { ReactNode } from 'react';

const queryClient = new QueryClient();

const wagmiConfig = createConfig({
    chains: [base],
    multiInjectedProviderDiscovery: false,
    connectors: [
        coinbaseWallet({
            appName: 'FramerIDE',
            preference: 'all',
            version: '4',
        }),
    ],
    transports: {
        [base.id]: http(),
    },
});

export function Providers({ children }: { children: ReactNode }) {
    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <OnchainKitProvider
                    apiKey={import.meta.env.VITE_ONCHAINKIT_API_KEY}
                    chain={base}
                >
                    {children}
                </OnchainKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
