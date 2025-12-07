import { useState } from 'react';

interface WaitlistModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    onError: (msg: string) => void;
}

export function WaitlistModal({ isOpen, onClose, onSuccess, onError }: WaitlistModalProps) {
    const [waitlistEmail, setWaitlistEmail] = useState('');
    const [isJoining, setIsJoining] = useState(false);

    const handleWaitlistSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsJoining(true);

        try {
            // Google Sheets Web App (Free, Unlimited)
            // See setup instructions in: /scripts/google-sheets-setup.md
            const GOOGLE_SHEETS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyl58egsnsZ6VKtdN7YUO1F45AgZ2Gq4GdpNYjPHtiyhjZcZgXbojiXHOgQBuHZNJVr-A/exec';

            const response = await fetch(GOOGLE_SHEETS_ENDPOINT, {
                method: 'POST',
                mode: 'no-cors', // Required for Google Apps Script
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: waitlistEmail,
                    timestamp: new Date().toISOString(),
                    source: 'FramerIDE Waitlist',
                    userAgent: navigator.userAgent
                }),
            });

            // Note: no-cors mode doesn't allow reading response
            // We assume success if no error is thrown
            setIsJoining(false);
            setWaitlistEmail('');
            onSuccess();
        } catch (error) {
            console.error('Waitlist error:', error);
            setIsJoining(false);
            onError('Something went wrong. Please try again.');
        }
    };

    return (
        <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="waitlist-content">
                <button className="close-modal-btn" onClick={onClose} aria-label="Close">&times;</button>
                <h2 className="text-2xl font-bold mb-2">Join the Waitlist</h2>
                <p className="text-gray-600 mb-6">Be the first to use it.</p>
                <form onSubmit={handleWaitlistSubmit} className="flex flex-col gap-4">
                    <input
                        type="email"
                        placeholder="Enter your email"
                        required
                        className="modal-input"
                        value={waitlistEmail}
                        onChange={(e) => setWaitlistEmail(e.target.value)}
                    />
                    <button type="submit" disabled={isJoining} className="btn-primary w-full">
                        {isJoining ? 'Joining...' : 'Join Now'}
                    </button>
                </form>
            </div>
        </div>
    );
}
