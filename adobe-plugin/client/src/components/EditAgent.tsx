import { useState } from 'react';
import { usePremium } from '../hooks/usePremium';
import { useEditAgent } from '../hooks/useEditAgent';
import PremiumGate from './PremiumGate';

export default function EditAgent() {
  const { isPremium, loading: premiumLoading } = usePremium();
  const { sendCommand, isProcessing, error } = useEditAgent();
  const [command, setCommand] = useState('');
  const [mode, setMode] = useState<'command' | 'autonomous'>('command');
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'agent'; text: string }>>([]);

  // Premium gate
  if (premiumLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Checking subscription...</div>
      </div>
    );
  }

  if (!isPremium) {
    return <PremiumGate feature="Edit Agent" />;
  }

  const handleSend = async () => {
    if (!command.trim() || isProcessing) return;

    // Add user message
    const userMessage = { type: 'user' as const, text: command };
    setMessages((prev) => [...prev, userMessage]);

    const currentCommand = command;
    setCommand('');

    // Send command
    const result = await sendCommand(currentCommand, mode);

    // Add agent response
    const agentMessage = {
      type: 'agent' as const,
      text: result.success ? result.message || 'Done!' : result.error || 'Failed',
    };
    setMessages((prev) => [...prev, agentMessage]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Mode Toggle */}
      <div className="p-4 border-b border-border">
        <div className="flex gap-2">
          <button
            onClick={() => setMode('command')}
            className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
              mode === 'command'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Individual Commands
          </button>
          <button
            onClick={() => setMode('autonomous')}
            className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
              mode === 'autonomous'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Autonomous Mode
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm">
            <p className="mb-4">Ask Pixi to edit your video</p>
            <div className="space-y-2 text-xs">
              <p>Try commands like:</p>
              <p className="font-mono bg-muted px-2 py-1 rounded">Add title "Hello World" at 2 seconds</p>
              <p className="font-mono bg-muted px-2 py-1 rounded">Cut at 5 seconds</p>
              <p className="font-mono bg-muted px-2 py-1 rounded">Add blur effect</p>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                  msg.type === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        {error && (
          <div className="mb-2 text-xs text-red-500 bg-red-500/10 px-2 py-1 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              mode === 'command'
                ? 'Add title "Hello World" at 2 seconds'
                : 'Create a marketing video with intro and effects'
            }
            disabled={isProcessing}
            className="flex-1 px-3 py-2 bg-muted border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isProcessing || !command.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
