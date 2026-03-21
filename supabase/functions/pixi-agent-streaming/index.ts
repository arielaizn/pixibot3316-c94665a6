import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// OpenClaw VPS configuration
const OPENCLAW_API_URL = Deno.env.get('OPENCLAW_API_URL') || 'http://localhost:8000/api/agent';
const OPENCLAW_API_KEY = Deno.env.get('OPENCLAW_API_KEY') || '';

interface CommandMessage {
  type: 'auth' | 'command' | 'ping';
  token?: string;
  command?: string;
  composition?: any;
}

interface AgentResponse {
  message: string;
  action?: {
    type: 'add_clip' | 'remove_clip' | 'update_clip' | 'add_effect' | 'split_clip' | 'trim_clip';
    payload: any;
  };
  status?: 'processing' | 'completed' | 'error';
}

// Parse natural language command into structured action
async function parseCommand(command: string, composition: any): Promise<AgentResponse> {
  // TODO: In production, send this to OpenClaw VPS for AI parsing
  // For now, implement simple pattern matching

  const lowerCommand = command.toLowerCase();

  // Remove/delete commands
  if (lowerCommand.includes('remove') || lowerCommand.includes('delete')) {
    if (lowerCommand.includes('all')) {
      return {
        message: "Removing all clips from the timeline.",
        action: {
          type: 'remove_clip',
          payload: { clipId: 'all' },
        },
        status: 'completed',
      };
    }

    if (lowerCommand.includes('last')) {
      const clips = composition?.clips || [];
      if (clips.length > 0) {
        const lastClip = clips[clips.length - 1];
        return {
          message: `Removing the last clip.`,
          action: {
            type: 'remove_clip',
            payload: { clipId: lastClip.id },
          },
          status: 'completed',
        };
      }
    }
  }

  // Scale commands
  if (lowerCommand.includes('scale')) {
    const scaleMatch = lowerCommand.match(/(\d+)%?/);
    if (scaleMatch) {
      const scale = parseInt(scaleMatch[1]) / 100;
      const clips = composition?.clips || [];
      if (clips.length > 0) {
        return {
          message: `Scaling video to ${scaleMatch[1]}%.`,
          action: {
            type: 'update_clip',
            payload: {
              clipId: clips[0].id,
              updates: {
                transform: { ...clips[0].transform, scale },
              },
            },
          },
          status: 'completed',
        };
      }
    }
  }

  // Rotate commands
  if (lowerCommand.includes('rotate')) {
    const rotateMatch = lowerCommand.match(/(\d+)\s*degrees?/);
    if (rotateMatch) {
      const degrees = parseInt(rotateMatch[1]);
      const clips = composition?.clips || [];
      if (clips.length > 0) {
        return {
          message: `Rotating video ${degrees} degrees.`,
          action: {
            type: 'update_clip',
            payload: {
              clipId: clips[0].id,
              updates: {
                transform: { ...clips[0].transform, rotate: degrees },
              },
            },
          },
          status: 'completed',
        };
      }
    }
  }

  // Trim/cut commands
  if (lowerCommand.includes('trim') || lowerCommand.includes('cut')) {
    const timeMatch = lowerCommand.match(/(\d+)\s*s(?:econds?)?/g);
    if (timeMatch && timeMatch.length >= 2) {
      const start = parseInt(timeMatch[0]) * 30; // Convert to frames
      const end = parseInt(timeMatch[1]) * 30;
      const duration = end - start;

      const clips = composition?.clips || [];
      if (clips.length > 0) {
        return {
          message: `Trimming video from ${timeMatch[0]} to ${timeMatch[1]}.`,
          action: {
            type: 'trim_clip',
            payload: {
              clipId: clips[0].id,
              start,
              duration,
            },
          },
          status: 'completed',
        };
      }
    }
  }

  // Default fallback
  return {
    message: "I understand you want to edit the video, but I need more specific instructions. Try commands like:\n• 'Remove the last clip'\n• 'Scale to 150%'\n• 'Rotate 90 degrees'\n• 'Trim from 2s to 5s'",
    status: 'completed',
  };
}

// Send command to OpenClaw VPS (if available)
async function sendToOpenClaw(command: string, composition: any): Promise<AgentResponse> {
  try {
    const response = await fetch(OPENCLAW_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENCLAW_API_KEY}`,
      },
      body: JSON.stringify({
        command,
        composition,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenClaw API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to connect to OpenClaw:', error);
    // Fallback to local parsing
    return parseCommand(command, composition);
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // WebSocket upgrade
  if (req.headers.get('upgrade') === 'websocket') {
    const { socket, response } = Deno.upgradeWebSocket(req);

    let isAuthenticated = false;

    socket.onopen = () => {
      console.log('WebSocket connected');
    };

    socket.onmessage = async (event) => {
      try {
        const data: CommandMessage = JSON.parse(event.data);

        // Handle authentication
        if (data.type === 'auth') {
          isAuthenticated = true;
          socket.send(JSON.stringify({
            message: 'Connected to Pixi AI Agent',
            status: 'completed',
          }));
          return;
        }

        // Handle ping (heartbeat)
        if (data.type === 'ping') {
          socket.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        // Handle command
        if (data.type === 'command') {
          if (!isAuthenticated) {
            socket.send(JSON.stringify({
              message: 'Authentication required',
              status: 'error',
            }));
            return;
          }

          // Send processing status
          socket.send(JSON.stringify({
            message: 'Processing your request...',
            status: 'processing',
          }));

          // Process command (via OpenClaw or local parsing)
          const result = OPENCLAW_API_URL
            ? await sendToOpenClaw(data.command!, data.composition)
            : await parseCommand(data.command!, data.composition);

          // Send result
          socket.send(JSON.stringify(result));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        socket.send(JSON.stringify({
          message: `Error: ${error.message}`,
          status: 'error',
        }));
      }
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return response;
  }

  // HTTP endpoint (for health check)
  return new Response(
    JSON.stringify({
      service: 'Pixi Agent Streaming',
      status: 'online',
      endpoints: {
        websocket: 'Upgrade connection to WebSocket',
      },
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
});
