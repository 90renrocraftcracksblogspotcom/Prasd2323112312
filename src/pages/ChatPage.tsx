import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, CornerDownLeft, Bot, User, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useChatStore } from '@/stores/chat-store';
import { cn } from '@/lib/utils';
import { useUserApiKey } from '@/hooks/use-user-api-key';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MODELS } from '@/lib/models';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
export function ChatPage() {
  const { sessionId: idFromUrl } = useParams<{ sessionId:string }>();
  const navigate = useNavigate();
  const {
    messages,
    isStreaming,
    sendMessage,
    switchSession,
    activeBot,
    currentModel,
    setModel,
  } = useChatStore();
  const { apiKey } = useUserApiKey();
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const initChat = async () => {
      if (!idFromUrl) {
        navigate('/explore');
        return;
      }
      setLoading(true);
      await switchSession(idFromUrl);
      setLoading(false);
    };
    initChat();
  }, [idFromUrl, navigate, switchSession]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);
  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming || !activeBot) return;
    const messageToSend = input.trim();
    setInput('');
    await sendMessage(messageToSend, activeBot.persona, apiKey);
  }, [input, isStreaming, activeBot, sendMessage, apiKey]);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  if (loading || !activeBot) {
    return (
      <div className="flex h-screen flex-col bg-gray-950">
        <header className="sticky top-0 z-10 flex h-[60px] items-center gap-4 border-b border-purple-500/10 bg-gray-950/50 px-6 backdrop-blur-lg sm:relative">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="text-center text-muted-foreground">Loading character...</div>
        </main>
      </div>
    );
  }
  return (
    <div className="flex h-screen flex-col bg-gray-950">
      <header className="sticky top-0 z-10 flex h-auto flex-col items-start gap-4 border-b border-purple-500/10 bg-gray-950/50 p-4 backdrop-blur-lg sm:relative sm:top-auto sm:h-auto sm:flex-row sm:items-center sm:border-0 sm:bg-transparent sm:px-6 sm:py-4 lg:px-8">
        <Button variant="ghost" size="icon" className="absolute left-4 top-2 sm:hidden" onClick={() => navigate('/explore')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-4 flex-grow pl-10 sm:pl-0">
            <Avatar className="h-9 w-9">
              <AvatarImage src={activeBot.avatar} alt={activeBot.name} />
              <AvatarFallback>{activeBot.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-gray-50">{activeBot.name}</h2>
              <p className="text-sm text-muted-foreground">{activeBot.description}</p>
            </div>
        </div>
        <div className="w-full sm:w-auto">
          <Select value={currentModel} onValueChange={setModel}>
            <SelectTrigger className="w-full sm:w-[200px] bg-gray-900/50 border-purple-500/20">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {MODELS.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="space-y-6">
          {messages.map((message, index) => (
            <motion.div
              key={message.id || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={cn("flex items-start gap-4", message.role === 'user' ? 'justify-end' : '')}
            >
              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={activeBot.avatar} />
                  <AvatarFallback>{activeBot.name.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl p-3 text-sm",
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-muted/50 rounded-bl-none',
                )}
              >
                <MarkdownRenderer content={message.content} />
                {isStreaming && message.role === 'assistant' && index === messages.length - 1 && (
                  <span className="blinking-cursor">|</span>
                )}
              </div>
              {message.role === 'user' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                </Avatar>
              )}
            </motion.div>
          ))}
          {isStreaming && messages[messages.length - 1]?.role === 'user' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-start gap-4"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={activeBot.avatar} />
                <AvatarFallback>{activeBot.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="max-w-[75%] rounded-2xl p-3 text-sm bg-muted/50 rounded-bl-none">
                <div className="flex space-x-1">
                  <span className="h-2 w-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
                  <span className="h-2 w-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <span className="h-2 w-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>
      <footer className="sticky bottom-0 border-t border-purple-500/10 bg-gray-950/50 p-4 backdrop-blur-lg">
        <div className="relative mx-auto max-w-3xl">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${activeBot.name}...`}
            className="min-h-[48px] w-full resize-none rounded-2xl border-purple-500/20 bg-gray-900 p-4 pr-16 shadow-sm focus:ring-2 focus:ring-purple-500"
            disabled={isStreaming}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-3 top-1/2 -translate-y-1/2"
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
          >
            {isStreaming ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
            ) : (
              <CornerDownLeft className="h-5 w-5" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </footer>
    </div>
  );
}