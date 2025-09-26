import type { Message } from './types';
// A simplified fetch-based handler for NVIDIA API
export class ChatHandler {
  private baseUrl: string;
  private apiKey: string;
  private model: string;
  private env: any;
  constructor(baseUrl: string, apiKey: string, model: string, env: any) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.model = model;
    this.env = env;
  }
  async processMessage(
    message: string,
    conversationHistory: Message[],
    persona?: string,
    onChunk?: (chunk: string) => void,
    userApiKey?: string
  ): Promise<{ content: string }> {
    const messages = this.buildConversationMessages(message, conversationHistory, persona);
    const body = {
      model: this.model,
      messages,
      temperature: 0.7,
      top_p: 1,
      max_tokens: 1024,
      stream: !!onChunk,
    };
    const finalApiKey = userApiKey || this.apiKey;
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalApiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("NVIDIA API Error:", errorText);
      throw new Error(`NVIDIA API Error: ${response.status} ${errorText}`);
    }
    if (onChunk && response.body) {
      return this.handleStreamResponse(response.body, onChunk);
    }
    // This part is for non-streaming, which we are not using for now.
    const result = await response.json() as any;
    return { content: result.choices[0]?.message?.content || '' };
  }
  private async handleStreamResponse(
    body: ReadableStream<Uint8Array>,
    onChunk: (chunk: string) => void
  ): Promise<{ content: string }> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the last partial line in the buffer
      for (const line of lines) {
        if (line.trim().startsWith('data: ')) {
          const dataContent = line.substring(6).trim();
          if (dataContent === '[DONE]') {
            break;
          }
          try {
            const json = JSON.parse(dataContent);
            const content = json.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              onChunk(content);
            }
          } catch (e) {
            console.error('Error parsing stream data chunk:', e, `Chunk: "${dataContent}"`);
          }
        }
      }
    }
    return { content: fullContent };
  }
  private buildConversationMessages(
    userMessage: string,
    history: Message[],
    persona?: string
  ): { role: 'system' | 'user' | 'assistant'; content: string }[] {
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];
    if (persona) {
      messages.push({ role: 'system', content: persona });
    }
    // Add history, excluding the most recent user message which is added separately
    history.slice(0, -1).forEach(msg => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: msg.content });
      }
    });
    messages.push({ role: 'user', content: userMessage });
    return messages;
  }
  updateModel(newModel: string): void {
    this.model = newModel;
  }
}