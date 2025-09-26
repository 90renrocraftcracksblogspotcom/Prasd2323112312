import type { Bot } from './bots';
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  id: string;
  toolCalls?: unknown[];
}
export interface ChatState {
  messages: Message[];
  sessionId: string;
  isProcessing: boolean;
  model: string;
  botId?: string; // Add botId to ChatState
  streamingMessage?: string;
}
export interface SessionInfo {
  id: string;
  title: string;
  createdAt: number;
  lastActive: number;
}
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
class ChatService {
  private sessionId: string | null = null;
  private baseUrl: string = '/api/chat';
  private getUrl(path: string): string {
    if (!this.sessionId) {
      throw new Error("Session ID is not set.");
    }
    return `${this.baseUrl}/${this.sessionId}/${path}`;
  }
  async sendMessage(
    message: string,
    model: string,
    persona: string,
    onChunk: (chunk: string) => void,
    apiKey?: string | null
  ): Promise<void> {
    if (!this.sessionId) throw new Error("No active session");
    try {
      const response = await fetch(this.getUrl('chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, model, stream: true, persona, apiKey }),
      });
      if (!response.ok || !response.body) {
        throw new Error(`API Error: ${response.status}`);
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        onChunk(chunk);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      onChunk("\n\nSorry, I encountered an error.");
    }
  }
  async getMessages(): Promise<ApiResponse<ChatState>> {
    if (!this.sessionId) return { success: false, error: "No active session" };
    try {
      const response = await fetch(this.getUrl('messages'));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to load messages' };
    }
  }
  switchSession(sessionId: string): void {
    this.sessionId = sessionId;
  }
  async createSession(title?: string, botId?: string): Promise<ApiResponse<{ sessionId: string; title: string }>> {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, botId }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to create session' };
    }
  }
  async listSessions(): Promise<ApiResponse<SessionInfo[]>> {
    try {
      const response = await fetch('/api/sessions');
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to list sessions' };
    }
  }
  async deleteSession(sessionId: string): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to delete session' };
    }
  }
  async updateModel(model: string): Promise<ApiResponse<ChatState>> {
    if (!this.sessionId) return { success: false, error: "No active session" };
    try {
        const response = await fetch(this.getUrl('model'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model }),
        });
        return await response.json();
    } catch (error) {
        return { success: false, error: 'Failed to update model' };
    }
  }
}
export const chatService = new ChatService();