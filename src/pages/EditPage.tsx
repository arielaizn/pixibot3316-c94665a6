import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/hooks/useCredits';
import { VideoEditor } from '@/components/editor/VideoEditor';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const EditPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: credits, isLoading: creditsLoading } = useCredits();

  // Loading state
  if (authLoading || creditsLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/5 to-background">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-primary/20 to-accent/20 rounded-full" />
            <Loader2 className="relative w-16 h-16 animate-spin text-primary mx-auto" />
          </div>
          <p className="text-lg font-semibold text-foreground mb-2">טוען עורך וידאו...</p>
          <p className="text-sm text-muted-foreground">מכין את הכלים שלך</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: '/edit' }} replace />;
  }

  // Free plan - show upgrade prompt
  if (credits?.plan_type === 'free') {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5">
        <div className="container mx-auto px-4 py-16 text-center max-w-3xl">
          {/* Icon */}
          <div className="mb-8 relative">
            <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-primary/30 to-accent/30 rounded-full scale-150" />
            <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-luxury-lg bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/30 shadow-luxury-xl mb-4">
              <svg
                className="w-12 h-12 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient bg-300%">
            מנויים בלבד
          </h1>

          <p className="text-sm text-primary/60 font-semibold mb-6 tracking-wide uppercase">
            Premium Feature
          </p>

          {/* Description */}
          <div className="mb-10 max-w-xl mx-auto">
            <p className="text-lg text-foreground mb-4 leading-relaxed font-medium">
              עורך הוידאו הוא תכונה פרימיום הזמינה למנויים בתשלום בלבד
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              שדרג את התוכנית שלך כדי לפתוח עריכת וידאו מקצועית עם סיוע AI,
              אפקטים מתקדמים, ויכולות 3D
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-3 gap-4 mb-10 max-w-2xl mx-auto">
            {[
              { icon: '🤖', label: 'AI Agent' },
              { icon: '🎨', label: 'אפקטים מתקדמים' },
              { icon: '🎬', label: 'עריכה מקצועית' },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-4 rounded-luxury-lg bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-200"
              >
                <div className="text-3xl mb-2">{feature.icon}</div>
                <p className="text-xs text-muted-foreground font-semibold">{feature.label}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <Button asChild variant="outline" size="lg">
              <Link to="/dashboard">חזרה לדשבורד</Link>
            </Button>
            <Button asChild variant="luxury" size="luxury-lg" className="group">
              <Link to="/pricing">
                שדרג עכשיו
                <svg
                  className="w-4 h-4 mr-2 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Subscriber - show editor
  return <VideoEditor />;
};

export default EditPage;
