import { useState, useEffect } from 'react';
import { JSXBridge } from './lib/jsx-bridge';
import AuthPanel from './components/AuthPanel';
import ProjectBrowser from './components/ProjectBrowser';
import EditAgent from './components/EditAgent';
import mascot from './assets/pixi-mascot.png';

type Theme = 'light' | 'dark' | 'system';

export default function App() {
  const [hostApp, setHostApp] = useState<'premiere' | 'aftereffects' | 'unknown'>('unknown');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'projects' | 'edit-agent'>('projects');
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('pixibot_theme') as Theme) || 'system';
  });
  const [isRTL, setIsRTL] = useState(() => {
    return localStorage.getItem('pixibot_rtl') === 'true';
  });

  useEffect(() => {
    // Detect host application
    const app = JSXBridge.getHostApplication();
    setHostApp(app);

    // Check if already authenticated
    const session = localStorage.getItem('pixibot_session');
    if (session) {
      setIsAuthenticated(true);
    }
  }, []);

  // Apply theme
  useEffect(() => {
    localStorage.setItem('pixibot_theme', theme);
    const root = document.documentElement;

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('dark', e.matches);
    };
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [theme]);

  // Apply RTL
  useEffect(() => {
    localStorage.setItem('pixibot_rtl', String(isRTL));
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [isRTL]);

  const cycleTheme = () => {
    setTheme(prev => prev === 'system' ? 'light' : prev === 'light' ? 'dark' : 'system');
  };

  const themeIcon = theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '💻';
  const themeLabel = theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System';

  if (!isAuthenticated) {
    return <AuthPanel onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={mascot} alt="Pixi" className="h-6 w-6" />
            <h1 className="text-lg font-semibold text-foreground">Pixibot</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={cycleTheme}
              className="px-2 py-1 text-xs rounded-md bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title={`Theme: ${themeLabel}`}
            >
              {themeIcon}
            </button>

            {/* RTL/LTR Toggle */}
            <button
              onClick={() => setIsRTL(!isRTL)}
              className="px-2 py-1 text-xs rounded-md bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors font-medium"
              title={isRTL ? 'Switch to LTR' : 'Switch to RTL'}
            >
              {isRTL ? 'RTL' : 'LTR'}
            </button>

            {/* Host App */}
            <span className="text-xs text-muted-foreground">
              {hostApp === 'premiere' ? 'PP' : hostApp === 'aftereffects' ? 'AE' : ''}
            </span>

            {/* Logout */}
            <button
              onClick={() => {
                localStorage.removeItem('pixibot_session');
                setIsAuthenticated(false);
              }}
              className="px-2 py-1 text-xs rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors font-medium"
              title="Sign out"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'projects'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Projects
        </button>
        <button
          onClick={() => setActiveTab('edit-agent')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'edit-agent'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Edit Agent
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'projects' ? <ProjectBrowser /> : <EditAgent />}
      </div>
    </div>
  );
}
