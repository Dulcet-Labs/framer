interface WelcomeHeroProps {
    onStartBuilding: () => void;
}

export function WelcomeHero({ onStartBuilding }: WelcomeHeroProps) {
    return (
        <div className="welcome-container">
            <div className="ambient-orb orb-1"></div>
            <div className="ambient-orb orb-2"></div>
            <div className="hero-content">
                <h1 className="welcome-title">Welcome to <span className="brand-highlight">FramerIDE</span></h1>
                <p className="welcome-subtitle">
                    The next gen environment for building DApps & Mini Apps on Base. <br />
                    Fast, intuitive, and powerful.
                </p>
                <div className="cta-group">
                    <button onClick={onStartBuilding} className="btn-primary">Start Building</button>
                    <button className="btn-secondary">Documentation</button>
                </div>
            </div>
        </div>
    );
}
