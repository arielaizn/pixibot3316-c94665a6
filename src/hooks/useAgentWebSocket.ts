import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useVideoEditor } from './useVideoEditor';

// Webhook API Configuration
const WEBHOOK_API_URL = 'https://webhook.pixibot.app/api/agent';
const WEBHOOK_HEALTH_URL = 'https://webhook.pixibot.app/health';
const WEBHOOK_API_KEY = 'pixi-webhook-secret-2026';

interface AgentResponse {
  message: string;
  action?: {
    type: 'add_clip' | 'remove_clip' | 'update_clip' | 'add_effect' | 'split_clip' | 'trim_clip';
    payload: any;
  };
  status?: 'processing' | 'completed' | 'error';
}

export const useAgentWebSocket = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { addClip, removeClip, updateClip } = useVideoEditor();

  // Apply agent action to the video editor
  const applyAgentAction = useCallback((action: AgentResponse['action']) => {
    if (!action) return;

    switch (action.type) {
      case 'add_clip':
        addClip(action.payload.videoUrl, action.payload.start, action.payload.duration);
        break;

      case 'remove_clip':
        removeClip(action.payload.clipId);
        break;

      case 'update_clip':
        updateClip(action.payload.clipId, action.payload.updates);
        break;

      case 'trim_clip':
        updateClip(action.payload.clipId, {
          start: action.payload.start,
          duration: action.payload.duration,
        });
        break;

      case 'split_clip':
        // TODO: Implement split logic
        console.log('Split clip not yet implemented', action.payload);
        break;

      default:
        console.warn('Unknown action type:', action.type);
    }
  }, [addClip, removeClip, updateClip]);

  // Check API health and connection
  const connect = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      console.log('Checking webhook API health...');
      const response = await fetch(WEBHOOK_HEALTH_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${WEBHOOK_API_KEY}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Webhook API connected:', data);
        setIsConnected(true);
      } else {
        console.warn('Webhook API health check failed:', response.status);
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Failed to connect to webhook API:', error);
      setIsConnected(false);
    }
  }, [user]);

  // Send command to agent via REST API
  const sendCommand = useCallback(
    async (command: string): Promise<AgentResponse> => {
      if (!isConnected) {
        throw new Error('Not connected to agent');
      }

      setIsProcessing(true);

      try {
        const response = await fetch(WEBHOOK_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${WEBHOOK_API_KEY}`,
          },
          body: JSON.stringify({
            command: 'send_message',
            message: command,
            composition: useVideoEditor.getState().composition,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data: AgentResponse = await response.json();

        // Apply action automatically
        if (data.action) {
          applyAgentAction(data.action);
        }

        setIsProcessing(false);
        return data;
      } catch (error) {
        setIsProcessing(false);
        throw error;
      }
    },
    [isConnected, applyAgentAction]
  );

  // Disconnect (no-op for REST API, but kept for compatibility)
  const disconnect = useCallback(() => {
    setIsConnected(false);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (user) {
      connect();
    }

    // No cleanup needed for REST API
  }, [user, connect]);

  return {
    sendCommand,
    isConnected,
    isProcessing,
    connect,
    disconnect,
  };
};
