import { useState, useEffect, useRef } from 'react';
import { useAgentWebSocket } from '@/hooks/useAgentWebSocket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, Bot, User, Sparkles, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
}

const exampleCommands = [
  "הגדל ל-150%",
  "סובב 90 מעלות",
  "הסר את הקליפ האחרון",
  "חתך מ-2s עד 5s",
  "אפס הכל",
];

export const ChatSidebar = () => {
  const { sendCommand, isConnected, isProcessing } = useAgentWebSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [showExamples, setShowExamples] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'system',
          content: "שלום! אני Pixi AI Agent.\n\nאני יכול לעזור לך לערוך את הסרטון שלך! נסה פקודות כמו:\n• 'הגדל ל-150%'\n• 'סובב 90 מעלות'\n• 'הסר את הקליפ האחרון'\n• 'אפס הכל'",
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    setShowExamples(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const response = await sendCommand(input);
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: response.message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: `❌ ${error instanceof Error ? error.message : 'Failed to send command'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">AI Agent</h3>
              <div className="flex items-center gap-1.5 text-xs">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                  }`}
                />
                <span className="text-muted-foreground">
                  {isConnected ? 'מחובר' : 'לא מחובר'}
                </span>
              </div>
            </div>
          </div>
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
      </div>

      {/* Messages - takes remaining space */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex gap-2 max-w-[85%]">
                {msg.role === 'agent' && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mt-1">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}

                <div
                  className={`rounded-2xl px-4 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : msg.role === 'system'
                      ? 'bg-muted/50 text-muted-foreground border border-border/50 rounded-bl-md'
                      : 'bg-card border border-border rounded-bl-md shadow-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <span className="text-xs opacity-60 mt-1 block">
                    {msg.timestamp.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {msg.role === 'user' && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex gap-2">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2 shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Agent עובד...</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Example Commands - Only show if connected */}
      {isConnected && showExamples && messages.length === 1 && (
        <div className="flex-shrink-0 px-4 pb-3 border-t border-border bg-muted/20">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 mt-3">
            <Info className="w-3 h-3" />
            <span className="font-medium">נסה פקודות אלה:</span>
          </div>
          <div className="space-y-1.5">
            {exampleCommands.map((example, i) => (
              <button
                key={i}
                onClick={() => handleExampleClick(example)}
                className="w-full text-right text-xs px-3 py-2 rounded-lg bg-card hover:bg-primary/5 border border-border hover:border-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isConnected}
              >
                💡 {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Coming Soon Notice - Only show if not connected */}
      {!isConnected && (
        <div className="flex-shrink-0 px-4 pb-3 border-t border-border bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 mt-3">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="font-medium">בקרוב...</span>
          </div>
          <div className="p-3 rounded-lg bg-card/50 backdrop-blur-sm border border-primary/20">
            <p className="text-xs text-muted-foreground leading-relaxed">
              🚀 תכונת ה-AI Agent נמצאת בפיתוח ותהיה זמינה בקרוב. בינתיים, השתמש בכלים הידניים בלשוניות הצד!
            </p>
          </div>
        </div>
      )}

      {/* Input - fixed at bottom */}
      <div className="flex-shrink-0 p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <Input
            variant="luxury"
            placeholder="ספר ל-agent מה לעשות..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={!isConnected || isProcessing}
            className="flex-1"
          />
          <Button
            variant="luxury"
            size="icon"
            onClick={handleSend}
            disabled={!isConnected || isProcessing || !input.trim()}
            className="flex-shrink-0"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {!isConnected && (
          <div className="mt-2 p-2 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Info className="w-3 h-3" />
              AI Agent לא זמין כרגע. השתמש בכלים הידניים בלשוניות!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
