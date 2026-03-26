import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useVideoEditor } from './useVideoEditor';
import { supabase } from '@/integrations/supabase/client';

// Supabase Edge Function URL
const AGENT_API_URL = 'https://ymhcczxxrgcnyxaqmohj.supabase.co/functions/v1/pixi-agent-streaming';

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

  const { addClip, removeClip, updateClip, scaleClip, rotateClip, composition } = useVideoEditor();

  // Apply agent action to the video editor
  const applyAgentAction = useCallback((action: AgentResponse['action']) => {
    if (!action) return;

    switch (action.type) {
      case 'add_clip':
        addClip(action.payload.videoUrl, action.payload.start, action.payload.duration);
        break;

      case 'remove_clip':
        if (action.payload.clipId === 'all') {
          // Remove all clips
          const state = useVideoEditor.getState();
          state.composition.clips.forEach(clip => removeClip(clip.id));
        } else if (action.payload.clipId === 'last') {
          // Remove last clip
          const state = useVideoEditor.getState();
          const lastClip = state.composition.clips[state.composition.clips.length - 1];
          if (lastClip) removeClip(lastClip.id);
        } else {
          removeClip(action.payload.clipId);
        }
        break;

      case 'update_clip':
        const updates = action.payload.updates || {};
        const clipId = action.payload.clipId || useVideoEditor.getState().composition.clips[0]?.id;

        if (clipId) {
          // Handle scale
          if (updates.scale !== undefined) {
            scaleClip(clipId, updates.scale);
          }
          // Handle rotation
          if (updates.rotate !== undefined) {
            rotateClip(clipId, updates.rotate);
          }
          // Handle other updates
          if (updates.transform || updates.x !== undefined || updates.y !== undefined) {
            updateClip(clipId, { transform: updates.transform || { x: updates.x, y: updates.y } });
          }
        }
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
  }, [addClip, removeClip, updateClip, scaleClip, rotateClip]);

  // Check API health and connection
  const connect = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      console.log('Checking AI Agent API...');

      // Check if we can get a session
      const session = (await supabase.auth.getSession()).data.session;

      if (!session) {
        console.warn('No auth session found');
        setIsConnected(false);
        return;
      }

      // Test the endpoint with a simple GET
      const response = await fetch(AGENT_API_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('AI Agent API connected:', data);
        setIsConnected(true);
      } else {
        console.warn('AI Agent API check failed:', response.status);
        setIsConnected(true); // Still mark as connected - the POST endpoint works even if GET returns status page
      }
    } catch (error) {
      console.error('Failed to connect to AI Agent API:', error);
      setIsConnected(true); // Mark as connected anyway - we'll handle errors on sendCommand
    }
  }, [user]);

  // Send command to agent via Supabase Edge Function
  const sendCommand = useCallback(
    async (command: string): Promise<AgentResponse> => {
      setIsProcessing(true);

      try {
        // Get current session
        const session = (await supabase.auth.getSession()).data.session;

        if (!session) {
          throw new Error('לא מחובר - נא להתחבר מחדש');
        }

        // Get current composition state
        const currentComposition = useVideoEditor.getState().composition;

        const response = await fetch(AGENT_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            command,
            context: {
              source: 'web',
              composition: currentComposition,
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API error: ${response.status} - ${errorText}`);
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
    [applyAgentAction]
  );

  // Disconnect
  const disconnect = useCallback(() => {
    setIsConnected(false);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (user) {
      connect();
    }
  }, [user, connect]);

  return {
    sendCommand,
    isConnected,
    isProcessing,
    connect,
    disconnect,
  };
};
