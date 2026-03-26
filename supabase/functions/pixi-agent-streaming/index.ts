import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Claude AI (Anthropic) configuration
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || '';
const CLAUDE_MODEL = 'claude-sonnet-4-5-20250929';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

interface AgentResponse {
  message: string;
  action?: {
    type: string;
    payload: any;
  };
  status?: 'processing' | 'completed' | 'error';
}

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// System prompt for Claude - instructs it to understand video editing commands
const EDITING_SYSTEM_PROMPT = `You are Pixi, an AI video editing assistant integrated into Adobe Premiere Pro and After Effects plugins.
You understand commands in both Hebrew and English.

Your job is to interpret the user's editing request and return a structured JSON action that the plugin can execute.

Available action types and their payloads:

1. "add_text" - Add text/title overlay
   payload: { text: string, time: number (seconds), fontSize?: number, position?: "center"|"top"|"bottom" }

2. "cut" - Make a cut/razor at a specific time
   payload: { time: number (seconds) }

3. "trim_clip" - Trim a clip
   payload: { clipIndex: number, startTime?: number, endTime?: number }

4. "add_effect" - Add a video effect
   payload: { effect: string (effect name), clipIndex?: number }

5. "update_clip" - Update clip properties (scale, rotate, position, opacity)
   payload: { clipIndex: number, updates: { scale?: number (0-1 ratio), rotate?: number (degrees), opacity?: number (0-100), position?: { x: number, y: number } } }

6. "remove_clip" - Remove a clip
   payload: { clipId: "all" | "last" | string }

7. "add_shape" - Add shape layer (After Effects only)
   payload: { shape: "rectangle"|"ellipse"|"polygon", width?: number, height?: number, color?: [r,g,b,a] }

8. "add_transition" - Add transition between clips
   payload: { type: "dissolve"|"fade"|"wipe"|"slide", duration?: number (seconds), clipIndex?: number }

9. "add_keyframe" - Add animation keyframe
   payload: { property: "scale"|"position"|"opacity"|"rotation", time: number, value: any, clipIndex?: number }

10. "autonomous" - Multi-step autonomous editing (when user requests complex operations)
    payload: { goal: string, steps: Array<{ type: string, payload: any }> }

IMPORTANT RULES:
- Always respond with valid JSON in this exact format: { "message": "description of what you're doing", "action": { "type": "...", "payload": { ... } }, "status": "completed" }
- If the user asks a question (not an editing command), respond with just a message and no action: { "message": "your helpful response", "status": "completed" }
- For autonomous/complex requests like "create a marketing video", break it down into multiple steps using the "autonomous" action type
- Understand Hebrew editing terms: חיתוך=cut, טקסט/כותרת=text/title, אפקט=effect, סיבוב=rotate, הגדלה/הקטנה=scale, מחיקה=delete, תנועה=animation
- Be concise in your messages
- Default clipIndex to 0 if not specified
- Default time to 0 if not specified
- For scale values, convert percentages to ratio (150% = 1.5)`;

// Send command to Claude AI
async function sendToClaude(command: string, context?: any): Promise<AgentResponse> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured');
  }

  const userMessage = context?.app
    ? `[App: ${context.app}] [Mode: ${context.mode || 'command'}] ${command}`
    : command;

  // Determine auth header: OAuth tokens (oat01) use Bearer, API keys use x-api-key
  const isOAuthToken = ANTHROPIC_API_KEY.includes('-oat01-');
  const authHeaders: Record<string, string> = isOAuthToken
    ? { 'Authorization': `Bearer ${ANTHROPIC_API_KEY}` }
    : { 'x-api-key': ANTHROPIC_API_KEY };

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: EDITING_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Claude API error:', response.status, errorText);
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const assistantMessage = data.content?.[0]?.text || '';

  console.log('Claude response:', assistantMessage);

  // Parse Claude's JSON response
  try {
    // Extract JSON from the response (Claude might wrap it in markdown code blocks)
    let jsonStr = assistantMessage;
    const jsonMatch = assistantMessage.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);
    return {
      message: parsed.message || 'Command processed',
      action: parsed.action || undefined,
      status: parsed.status || 'completed',
    };
  } catch {
    // If Claude didn't return valid JSON, return just the message
    return {
      message: assistantMessage,
      status: 'completed',
    };
  }
}

// Parse local editing commands for immediate Premiere/AE execution
function parseLocalEditCommand(command: string, context?: any): AgentResponse | null {
  const lowerCommand = command.toLowerCase();
  const app = context?.app; // 'premiere' | 'aftereffects'

  // Text/Title commands
  if (lowerCommand.includes('add') && (lowerCommand.includes('text') || lowerCommand.includes('title'))) {
    const textMatch = lowerCommand.match(/["'](.+?)["']/);
    const text = textMatch ? textMatch[1] : 'Sample Text';
    const timeMatch = lowerCommand.match(/(\d+)\s*(?:second|sec)/);
    const time = timeMatch ? parseFloat(timeMatch[1]) : 0;

    return {
      message: `Adding text "${text}" at ${time} seconds`,
      action: {
        type: 'add_text',
        payload: { text, time, fontSize: 60, position: 'center' },
      },
      status: 'completed',
    };
  }

  // Trim/Cut commands
  if (lowerCommand.includes('trim') || lowerCommand.includes('cut')) {
    const timeMatch = lowerCommand.match(/(\d+)\s*(?:second|sec)/);
    if (timeMatch) {
      return {
        message: `Cutting at ${timeMatch[1]} seconds`,
        action: {
          type: 'cut',
          payload: { time: parseFloat(timeMatch[1]) },
        },
        status: 'completed',
      };
    }
  }

  // Effect commands
  if (lowerCommand.includes('add') && lowerCommand.includes('effect')) {
    const effectMatch = lowerCommand.match(/effect\s+(\w+)/);
    const effect = effectMatch ? effectMatch[1] : 'blur';

    return {
      message: `Adding ${effect} effect`,
      action: {
        type: 'add_effect',
        payload: { effect, clipIndex: 0 },
      },
      status: 'completed',
    };
  }

  // Shape commands (After Effects)
  if (app === 'aftereffects' && lowerCommand.includes('shape')) {
    return {
      message: 'Creating shape layer',
      action: {
        type: 'add_shape',
        payload: { shape: 'rectangle', width: 200, height: 100, color: [1, 0, 0, 1] },
      },
      status: 'completed',
    };
  }

  // Scale commands
  if (lowerCommand.includes('scale')) {
    const scaleMatch = lowerCommand.match(/(\d+)%?/);
    if (scaleMatch) {
      return {
        message: `Scaling video to ${scaleMatch[1]}%`,
        action: {
          type: 'update_clip',
          payload: { clipIndex: 0, updates: { scale: parseInt(scaleMatch[1]) / 100 } },
        },
        status: 'completed',
      };
    }
  }

  // Rotate commands
  if (lowerCommand.includes('rotate')) {
    const rotateMatch = lowerCommand.match(/(\d+)\s*degrees?/);
    if (rotateMatch) {
      return {
        message: `Rotating video ${rotateMatch[1]} degrees`,
        action: {
          type: 'update_clip',
          payload: { clipIndex: 0, updates: { rotate: parseInt(rotateMatch[1]) } },
        },
        status: 'completed',
      };
    }
  }

  // Remove/delete commands
  if (lowerCommand.includes('remove') || lowerCommand.includes('delete')) {
    if (lowerCommand.includes('all')) {
      return {
        message: 'Removing all clips from the timeline',
        action: { type: 'remove_clip', payload: { clipId: 'all' } },
        status: 'completed',
      };
    }
    if (lowerCommand.includes('last')) {
      return {
        message: 'Removing the last clip',
        action: { type: 'remove_clip', payload: { clipId: 'last' } },
        status: 'completed',
      };
    }
  }

  // No local match found
  return null;
}

// Parse command for web app (non-plugin) context
function parseWebCommand(command: string, composition: any): AgentResponse {
  const lowerCommand = command.toLowerCase();
  const clips = composition?.clips || [];

  // Helper to get selected clip or first clip
  const getTargetClip = () => clips.length > 0 ? clips[0] : null;

  // Remove/Delete commands (Hebrew: מחק, הסר)
  if (lowerCommand.includes('remove') || lowerCommand.includes('delete') ||
      lowerCommand.includes('מחק') || lowerCommand.includes('הסר')) {
    if (lowerCommand.includes('all') || lowerCommand.includes('הכל')) {
      return {
        message: 'מסיר את כל הקליפים מהטיימליין.',
        action: { type: 'remove_clip', payload: { clipId: 'all' } },
        status: 'completed',
      };
    }
    if (lowerCommand.includes('last') || lowerCommand.includes('אחרון')) {
      if (clips.length > 0) {
        return {
          message: 'מסיר את הקליפ האחרון.',
          action: { type: 'remove_clip', payload: { clipId: clips[clips.length - 1].id } },
          status: 'completed',
        };
      }
    }
  }

  // Scale commands (Hebrew: הגדל, הקטן, שנה גודל, סקייל)
  if (lowerCommand.includes('scale') || lowerCommand.includes('הגדל') ||
      lowerCommand.includes('הקטן') || lowerCommand.includes('גודל') || lowerCommand.includes('סקייל')) {
    const scaleMatch = lowerCommand.match(/(\d+(?:\.\d+)?)%?/);
    if (scaleMatch) {
      const clip = getTargetClip();
      if (clip) {
        const scaleValue = parseFloat(scaleMatch[1]);
        const scaleFactor = scaleValue > 10 ? scaleValue / 100 : scaleValue; // Handle both 150 and 1.5
        return {
          message: `משנה גודל לסרטון ל-${Math.round(scaleFactor * 100)}%.`,
          action: {
            type: 'update_clip',
            payload: {
              clipId: clip.id,
              updates: { scale: scaleFactor }
            },
          },
          status: 'completed',
        };
      }
    }
  }

  // Rotate commands (Hebrew: סובב, סיבוב)
  if (lowerCommand.includes('rotate') || lowerCommand.includes('סובב') || lowerCommand.includes('סיבוב')) {
    const rotateMatch = lowerCommand.match(/(\d+)\s*(?:degrees?|מעלות)?/);
    if (rotateMatch) {
      const clip = getTargetClip();
      if (clip) {
        const degrees = parseInt(rotateMatch[1]);
        return {
          message: `מסובב את הסרטון ${degrees} מעלות.`,
          action: {
            type: 'update_clip',
            payload: {
              clipId: clip.id,
              updates: { rotate: degrees }
            },
          },
          status: 'completed',
        };
      }
    }
  }

  // Move/Position commands (Hebrew: הזז, מקם, מיקום)
  if (lowerCommand.includes('move') || lowerCommand.includes('position') ||
      lowerCommand.includes('הזז') || lowerCommand.includes('מקם') || lowerCommand.includes('מיקום')) {
    const xMatch = lowerCommand.match(/x[:\s]*(-?\d+)/i);
    const yMatch = lowerCommand.match(/y[:\s]*(-?\d+)/i);

    if (xMatch || yMatch) {
      const clip = getTargetClip();
      if (clip) {
        const x = xMatch ? parseInt(xMatch[1]) : (clip.transform?.x || 0);
        const y = yMatch ? parseInt(yMatch[1]) : (clip.transform?.y || 0);
        return {
          message: `מזיז את הסרטון למיקום X:${x}, Y:${y}.`,
          action: {
            type: 'update_clip',
            payload: {
              clipId: clip.id,
              updates: { x, y }
            },
          },
          status: 'completed',
        };
      }
    }
  }

  // Trim/Cut commands (Hebrew: חתך, קצץ, גזור)
  if (lowerCommand.includes('trim') || lowerCommand.includes('cut') ||
      lowerCommand.includes('חתך') || lowerCommand.includes('קצץ') || lowerCommand.includes('גזור')) {
    const timeMatch = lowerCommand.match(/(\d+(?:\.\d+)?)\s*s(?:ec|econds)?/gi);
    if (timeMatch && timeMatch.length >= 2) {
      const clip = getTargetClip();
      if (clip) {
        const start = parseFloat(timeMatch[0]) * 30;
        const end = parseFloat(timeMatch[1]) * 30;
        return {
          message: `חותך את הסרטון מ-${timeMatch[0]} עד ${timeMatch[1]}.`,
          action: {
            type: 'trim_clip',
            payload: { clipId: clip.id, start, duration: end - start }
          },
          status: 'completed',
        };
      }
    }
  }

  // Reset/Clear transform (Hebrew: אפס, נקה)
  if (lowerCommand.includes('reset') || lowerCommand.includes('אפס') || lowerCommand.includes('נקה')) {
    const clip = getTargetClip();
    if (clip) {
      return {
        message: 'מאפס את כל השינויים בסרטון.',
        action: {
          type: 'update_clip',
          payload: {
            clipId: clip.id,
            updates: { x: 0, y: 0, scale: 1, rotate: 0 }
          },
        },
        status: 'completed',
      };
    }
  }

  // Flip commands (Hebrew: הפוך)
  if (lowerCommand.includes('flip') || lowerCommand.includes('הפוך')) {
    const clip = getTargetClip();
    if (clip) {
      if (lowerCommand.includes('horizontal') || lowerCommand.includes('אופקי')) {
        return {
          message: 'מהפך את הסרטון אופקית.',
          action: {
            type: 'update_clip',
            payload: {
              clipId: clip.id,
              updates: { scale: -Math.abs(clip.transform?.scale || 1) }
            },
          },
          status: 'completed',
        };
      }
    }
  }

  // No command matched
  return {
    message: "אני מבין שאתה רוצה לערוך את הסרטון, אבל אני צריך הוראות ספציפיות יותר. נסה פקודות כמו:\n• 'הסר את הקליפ האחרון'\n• 'הגדל ל-150%'\n• 'סובב 90 מעלות'\n• 'חתך מ-2s עד 5s'\n• 'הזז X:100 Y:50'\n• 'אפס הכל'",
    status: 'completed',
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle POST requests (from Adobe plugin or web app)
  if (req.method === 'POST') {
    try {
      const { command, context } = await req.json();

      // --- Process the command ---

      // For plugin: try local parsing first for instant editing actions
      if (context?.source === 'plugin') {
        const localResult = parseLocalEditCommand(command, context);

        // If local parsing matched a quick editing command, return immediately
        if (localResult) {
          return new Response(JSON.stringify(localResult), { headers: corsHeaders });
        }

        // For complex commands, free-text, or autonomous mode, send to Claude AI
        try {
          const claudeResult = await sendToClaude(command, context);

          return new Response(
            JSON.stringify(claudeResult),
            { headers: corsHeaders }
          );
        } catch (err) {
          // Fallback: return help message
          return new Response(
            JSON.stringify({
              message: `AI agent error: ${(err as Error).message}. Try specific editing commands like:\n• 'Add title "Hello" at 2 seconds'\n• 'Cut at 5 seconds'\n• 'Add blur effect'\n• 'Scale to 150%'`,
              status: 'error',
            }),
            { status: 500, headers: corsHeaders }
          );
        }
      }

      // For web app context (non-plugin), use local parsing
      const result = parseWebCommand(command, context?.composition);
      return new Response(JSON.stringify(result), { headers: corsHeaders });

    } catch (error) {
      return new Response(
        JSON.stringify({ message: `Error: ${(error as Error).message}`, status: 'error' }),
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // WebSocket upgrade (for web app real-time editing)
  if (req.headers.get('upgrade') === 'websocket') {
    const { socket, response } = Deno.upgradeWebSocket(req);

    let isAuthenticated = false;

    socket.onopen = () => {
      console.log('WebSocket connected');
    };

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'auth') {
          isAuthenticated = true;
          socket.send(JSON.stringify({
            message: 'Connected to Pixi AI Agent (Claude)',
            status: 'completed',
          }));
          return;
        }

        if (data.type === 'ping') {
          socket.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        if (data.type === 'command') {
          if (!isAuthenticated) {
            socket.send(JSON.stringify({ message: 'Authentication required', status: 'error' }));
            return;
          }

          socket.send(JSON.stringify({ message: 'Processing your request...', status: 'processing' }));

          // Try Claude AI, fallback to local parsing
          try {
            const result = await sendToClaude(data.command!, data.context);
            socket.send(JSON.stringify(result));
          } catch {
            const result = parseWebCommand(data.command!, data.composition);
            socket.send(JSON.stringify(result));
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        socket.send(JSON.stringify({ message: `Error: ${(error as Error).message}`, status: 'error' }));
      }
    };

    socket.onclose = () => console.log('WebSocket disconnected');
    socket.onerror = (error) => console.error('WebSocket error:', error);

    return response;
  }

  // HTTP GET - health check
  return new Response(
    JSON.stringify({
      service: 'Pixi Agent Streaming',
      status: 'online',
      ai_backend: 'Claude AI (Anthropic)',
      endpoints: {
        post: 'POST with { user_id, command, context }',
        websocket: 'Upgrade connection to WebSocket',
      },
    }),
    { headers: corsHeaders }
  );
});
