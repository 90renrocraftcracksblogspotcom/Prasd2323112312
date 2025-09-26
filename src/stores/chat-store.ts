import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { chatService } from '@/lib/chat';
import { getBot, Bot } from '@/lib/bots';
import type { Message, SessionInfo } from '@/lib/chat';
import { DEFAULT_MODEL } from '@/lib/models';
export interface ChatState {
  sessions: SessionInfo[];
  currentSessionId: string | null;
  messages: Message[];
  activeBot: Bot | null;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  currentModel: string;
}
export interface ChatActions {
  fetchSessions: () => Promise<void>;
  startNewSession: (bot: Bot) => Promise<string | undefined>;
  switchSession: (sessionId: string) => Promise<void>;
  sendMessage: (message: string, persona: string, apiKey?: string | null) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  setModel: (modelId: string) => Promise<void>;
  clearError: () => void;
}
export const useChatStore = create<ChatState & ChatActions>()(
  immer((set, get) => ({
    sessions: [],
    currentSessionId: null,
    messages: [],
    activeBot: null,
    isLoading: false,
    isStreaming: false,
    error: null,
    currentModel: DEFAULT_MODEL,
    fetchSessions: async () => {
      set({ isLoading: true });
      const response = await chatService.listSessions();
      if (response.success && response.data) {
        set({ sessions: response.data, isLoading: false });
      } else {
        set({ error: response.error || 'Failed to fetch sessions.', isLoading: false });
      }
    },
    startNewSession: async (bot) => {
      set({ isLoading: true, messages: [], activeBot: bot, currentSessionId: null, currentModel: DEFAULT_MODEL });
      const response = await chatService.createSession(bot.name, bot.id);
      if (response.success && response.data) {
        const { sessionId } = response.data;
        chatService.switchSession(sessionId);
        set({
          currentSessionId: sessionId,
          messages: [{ role: 'assistant', content: bot.greeting, timestamp: Date.now(), id: crypto.randomUUID() }],
          isLoading: false,
        });
        await get().fetchSessions(); // Refresh session list
        return sessionId;
      } else {
        set({ error: response.error || 'Failed to start new session.', isLoading: false });
        return undefined;
      }
    },
    switchSession: async (sessionId) => {
      if (get().currentSessionId === sessionId) return;
      set({ isLoading: true, messages: [], activeBot: null });
      chatService.switchSession(sessionId);
      const messagesResponse = await chatService.getMessages();
      if (messagesResponse.success && messagesResponse.data) {
        const botId = messagesResponse.data.botId;
        let bot: Bot | null = null;
        if (botId) {
          bot = await getBot(botId);
        }
        set({
          currentSessionId: sessionId,
          messages: messagesResponse.data.messages,
          activeBot: bot,
          currentModel: messagesResponse.data.model || DEFAULT_MODEL,
          isLoading: false,
        });
      } else {
        set({ error: messagesResponse.error || 'Failed to load session.', isLoading: false });
      }
    },
    sendMessage: async (message, persona, apiKey) => {
      const sessionId = get().currentSessionId;
      const model = get().currentModel;
      if (!sessionId || get().isStreaming) return;
      set(state => {
        state.isStreaming = true;
        state.messages.push({ role: 'user', content: message, timestamp: Date.now(), id: crypto.randomUUID() });
        // Add an empty assistant message to stream into
        state.messages.push({ role: 'assistant', content: '', timestamp: Date.now(), id: crypto.randomUUID() });
      });
      await chatService.sendMessage(
        message,
        model,
        persona,
        (chunk) => {
          set(state => {
            // Append chunk to the last message's content
            const lastMessage = state.messages[state.messages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.content += chunk;
            }
          });
        },
        apiKey
      );
      set(state => {
        state.isStreaming = false;
      });
    },
    deleteSession: async (sessionId) => {
      const response = await chatService.deleteSession(sessionId);
      if (response.success) {
        set(state => {
          state.sessions = state.sessions.filter(s => s.id !== sessionId);
          if (state.currentSessionId === sessionId) {
            state.currentSessionId = null;
            state.messages = [];
            state.activeBot = null;
          }
        });
      } else {
        set({ error: response.error || 'Failed to delete session.' });
      }
    },
    setModel: async (modelId: string) => {
        const sessionId = get().currentSessionId;
        if (!sessionId) return;
        set({ currentModel: modelId });
        await chatService.updateModel(modelId);
    },
    clearError: () => {
      set({ error: null });
    },
  }))
);