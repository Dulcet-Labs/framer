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

    const handleWaitlistSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsJoining(true);

        setTimeout(() => {
            // Simulate error
            if (waitlistEmail.includes('error')) {
                setIsJoining(false);
                onError('Something went wrong. Please try again.');
                return;
            }

            setIsJoining(false);
            setWaitlistEmail('');
            onSuccess();
        }, 1000);
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
