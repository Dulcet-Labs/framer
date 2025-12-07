import { useState, useEffect } from 'react';
import BaseSb from '../assets/BaseSb.svg';
import BaseSw from '../assets/BaseSw.svg';

interface WelcomeHeroProps {
    onStartBuilding: () => void;
}

export function WelcomeHero({ onStartBuilding }: WelcomeHeroProps) {
    const [showImage, setShowImage] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        const updateTheme = () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            setTheme(currentTheme === 'dark' ? 'dark' : 'light');
        };
        updateTheme();
        const observer = new MutationObserver(updateTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setShowImage(prev => !prev);
        }, 300000); // Switch every 5 minutes
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="welcome-container">
            <div className="ambient-orb orb-1"></div>
            <div className="ambient-orb orb-2"></div>
            <div className="hero-content">
                <h1 className="welcome-title">
                    Welcome to{' '}
                    <span className="brand-highlight-wrapper">
                        <span
                            className={`brand-highlight ${showImage ? 'slide-out' : 'slide-in'}`}
                            style={{ display: showImage ? 'none' : 'inline-block' }}
                        >
                            FramerIDE
                        </span>
                        <img
                            src={theme === 'dark' ? BaseSw : BaseSb}
                            alt="Base"
                            className={`brand-logo ${showImage ? 'slide-in' : 'slide-out'}`}
                            style={{ display: showImage ? 'inline-block' : 'none' }}
                        />
                    </span>
                </h1>
                <p className="welcome-subtitle">
                    The next gen environment for building DApps & Mini Apps on Base. <br />
                    Fast, intuitive, and powerful.
                </p>
                <div className="cta-group">
                    <button onClick={onStartBuilding} className="btn-primary">Start Building</button>
                </div>
            </div>
        </div>
    );
}
