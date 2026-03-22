# Pixi AI Agent Commands

## Overview

The Pixi AI Agent allows you to edit videos using natural language commands. The agent understands your intent and applies the appropriate transformations to your video timeline.

## Supported Commands

### Clip Management

#### Remove Clips
- `"Remove the last clip"` - Removes the most recent clip from the timeline
- `"Delete all clips"` - Clears the entire timeline
- `"Remove clip"` - Removes the currently selected clip

### Transformations

#### Scale
- `"Scale to 150%"` - Scales the video to 150% of original size
- `"Zoom to 200%"` - Same as scale to 200%
- `"Make it bigger"` - Scales to 120%
- `"Make it smaller"` - Scales to 80%

#### Rotate
- `"Rotate 90 degrees"` - Rotates the video 90 degrees clockwise
- `"Rotate 180 degrees"` - Flips the video upside down
- `"Turn it 45 degrees"` - Rotates 45 degrees

### Timing

#### Trim/Cut
- `"Trim from 2s to 5s"` - Cuts the video to show only seconds 2-5
- `"Cut from 0 to 10 seconds"` - Keeps only the first 10 seconds
- `"Trim to 5 seconds"` - Shortens the video to 5 seconds total

## Command Examples

### Basic Workflow

1. **Import a video:**
   - Click the "Import" button in the toolbar
   - Select a video from your Projects

2. **Edit with AI:**
   ```
   "Scale to 150%"
   "Rotate 90 degrees"
   "Trim from 2s to 8s"
   ```

3. **Export:**
   - Click "Export" to save your edited video

## Advanced Usage

### Natural Language

The agent understands natural language variations:
- ✅ "Make the video bigger" → Scale up
- ✅ "Spin it around" → Rotate
- ✅ "Cut out the first 3 seconds" → Trim
- ✅ "Start from 5 seconds" → Trim beginning

### Combining Commands

You can issue multiple commands in sequence:
1. `"Scale to 200%"`
2. `"Rotate 45 degrees"`
3. `"Trim from 2s to 10s"`

Each command is applied to the current state.

## Current Limitations (MVP)

- ⚠️ **Single clip editing:** Currently optimized for editing one clip at a time
- ⚠️ **Effects not yet supported:** Filters, transitions, and overlays coming in Phase 3
- ⚠️ **No undo/redo:** Manual clip management only
- ⚠️ **OpenClaw integration:** Local pattern matching used as fallback

## Troubleshooting

### Agent Not Responding
- Check connection status (green dot in chat header)
- Refresh the page to reconnect
- Check browser console for WebSocket errors

### Command Not Understood
- Try rephrasing with specific values (e.g., "90 degrees" instead of "a bit")
- Use the example commands as templates
- Check spelling of key words (scale, rotate, trim, etc.)

### Video Not Updating
- Ensure you've imported a video first
- Check that the clip appears in the timeline
- Refresh the preview by seeking to a different time

## Coming in Phase 3

- 🎨 **Effects:** Blur, brightness, contrast, saturation
- 🎬 **Transitions:** Fade, wipe, slide
- 🎯 **Keyframes:** Animated properties over time
- 📝 **Text overlays:** Add titles and captions
- 🎵 **Audio:** Background music and sound effects
- 🤖 **Advanced AI:** Context-aware suggestions, automatic editing

## API Reference (For Developers)

### Agent Response Format

```typescript
interface AgentResponse {
  message: string;                    // Human-readable feedback
  action?: {
    type: 'add_clip' | 'remove_clip' | 'update_clip' | 'trim_clip';
    payload: any;                     // Action-specific data
  };
  status?: 'processing' | 'completed' | 'error';
}
```

### WebSocket Messages

```typescript
// Send command
{
  type: 'command',
  command: 'Scale to 150%',
  composition: { clips: [...], effects: [...] }
}

// Receive response
{
  message: 'Scaling video to 150%.',
  action: {
    type: 'update_clip',
    payload: {
      clipId: 'abc123',
      updates: { transform: { scale: 1.5 } }
    }
  },
  status: 'completed'
}
```

## Feedback & Suggestions

Have ideas for new commands? Open an issue on GitHub or reach out to the Pixi team!
