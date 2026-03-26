interface PremiumGateProps {
  feature: string;
}

export default function PremiumGate({ feature }: PremiumGateProps) {
  const handleUpgrade = () => {
    // Open pricing page in browser
    if (typeof window.cep !== 'undefined') {
      window.cep.util.openURLInDefaultBrowser('https://pixibot.app/pricing');
    } else {
      window.open('https://pixibot.app/pricing', '_blank');
    }
  };

  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="max-w-md text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-foreground">Premium Feature</h2>

        <p className="text-muted-foreground">
          {feature} is available to premium subscribers only.
        </p>

        <ul className="text-sm text-muted-foreground space-y-1 text-left">
          <li>✨ AI-powered editing commands</li>
          <li>🤖 Autonomous editing mode</li>
          <li>⚡ Import unlimited projects</li>
          <li>🎬 Advanced automation</li>
        </ul>

        <button
          onClick={handleUpgrade}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
        >
          Upgrade to Premium
        </button>

        <p className="text-xs text-muted-foreground">
          Starting at $49/month
        </p>
      </div>
    </div>
  );
}
