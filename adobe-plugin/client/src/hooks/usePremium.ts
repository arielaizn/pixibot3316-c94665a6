import { useState, useEffect } from 'react';

const SUPABASE_URL = 'https://ymhcczxxrgcnyxaqmohj.supabase.co';

export function usePremium() {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [planType, setPlanType] = useState<string>('free');

  useEffect(() => {
    checkPremiumStatus();
  }, []);

  const checkPremiumStatus = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('pixibot_session') || '{}');
      if (!session.access_token) {
        setIsPremium(false);
        setLoading(false);
        return;
      }

      // Use the pixi-plugin-projects Edge Function which already returns isPremium
      // This avoids CORS issues with PostgREST from file:// origin
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/pixi-plugin-projects`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to check premium: ${response.status}`);
      }

      const data = await response.json();
      setIsPremium(data.isPremium || false);
      setPlanType(data.planType || 'free');
    } catch (err) {
      console.error('Failed to check premium status:', err);
      setIsPremium(false);
    } finally {
      setLoading(false);
    }
  };

  return { isPremium, loading, planType };
}
