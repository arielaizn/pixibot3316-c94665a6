import { useState } from 'react';
import { JSXBridge } from '../lib/jsx-bridge';

export function useEditAgent() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCommand = async (command: string, mode: 'command' | 'autonomous') => {
    setIsProcessing(true);
    setError(null);

    try {
      const session = JSON.parse(localStorage.getItem('pixibot_session') || '{}');
      const hostApp = JSXBridge.getHostApplication();

      // Call pixi-agent-streaming
      const response = await fetch(
        'https://ymhcczxxrgcnyxaqmohj.supabase.co/functions/v1/pixi-agent-streaming',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: session.user?.id,
            command,
            context: {
              source: 'plugin',
              app: hostApp,
              mode,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process command');
      }

      const result = await response.json();

      if (result.status === 'error') {
        throw new Error(result.message);
      }

      // Execute action in host app
      if (result.action) {
        const jsxResult = await JSXBridge.executeEditCommand(result.action);

        if (!jsxResult.success) {
          throw new Error(jsxResult.error || 'ExtendScript execution failed');
        }

        return {
          success: true,
          message: result.message,
          jsxResult,
        };
      }

      return {
        success: true,
        message: result.message,
      };
    } catch (err: any) {
      console.error('Edit agent error:', err);
      setError(err.message || 'Failed to execute command');
      return {
        success: false,
        error: err.message,
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return { sendCommand, isProcessing, error };
}
