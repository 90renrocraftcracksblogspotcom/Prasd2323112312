import { Agent } from 'agents';
import type { Env } from './core-utils';
import type { ChatState } from './types';
import { ChatHandler } from './chat';
import { API_RESPONSES } from './config';
import { createMessage, createStreamResponse, createEncoder, delay } from './utils';
/**
 * ChatAgent - Main agent class using Cloudflare Agents SDK
 *
 * This class extends the Agents SDK Agent class and handles all chat operations.
 */
export class ChatAgent extends Agent<Env, ChatState> {
  private chatHandler?: ChatHandler;
  // Initial state for new chat sessions
  initialState: ChatState = {
    messages: [],
    sessionId: crypto.randomUUID(),
    isProcessing: false,
    model: 'meta/llama-3.1-8b-instruct',
    botId: undefined,
  };
  /**
   * Initialize chat handler when agent starts
   */
  async onStart(): Promise<void> {
    // Use NVIDIA API key and a generic base URL for NVIDIA
    this.chatHandler = new ChatHandler(
      'https://integrate.api.nvidia.com/v1',
      this.env.NVIDIA_API_KEY,
      this.state.model,
      this.env
    );
    console.log(`ChatAgent ${this.name} initialized with session ${this.state.sessionId} for NVIDIA`);
  }
  /**
   * Handle incoming requests - clean routing with error handling
   */
  async onRequest(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const method = request.method;
      // Route to appropriate handler
      if (method === 'GET' && url.pathname === '/messages') {
        return this.handleGetMessages();
      }
      if (method === 'POST' && url.pathname === '/chat') {
        return this.handleChatMessage(await request.json());
      }
      if (method === 'DELETE' && url.pathname === '/clear') {
        return this.handleClearMessages();
      }
      if (method === 'POST' && url.pathname === '/model') {
        return this.handleModelUpdate(await request.json());
      }
      if (method === 'POST' && url.pathname === '/set-bot-id') {
        const { botId } = await request.json<{ botId: string }>();
        this.setState({ ...this.state, botId });
        return Response.json({ success: true });
      }
      return Response.json({
        success: false,
        error: API_RESPONSES.NOT_FOUND
      }, { status: 404 });
    } catch (error) {
      console.error('Request handling error:', error);
      return Response.json({
        success: false,
        error: API_RESPONSES.INTERNAL_ERROR
      }, { status: 500 });
    }
  }
  /**
   * Get current conversation messages
   */
  private handleGetMessages(): Response {
    return Response.json({
      success: true,
      data: this.state
    });
  }
  /**
   * Process new chat message
   */
  private async handleChatMessage(body: { message: string; model?: string; stream?: boolean; persona?: string; apiKey?: string }): Promise<Response> {
    const { message, model, stream, persona, apiKey } = body;
    if (!message?.trim()) {
      return Response.json({ success: false, error: API_RESPONSES.MISSING_MESSAGE }, { status: 400 });
    }
    if (model && model !== this.state.model) {
      this.setState({ ...this.state, model });
      this.chatHandler?.updateModel(model);
    }
    const userMessage = createMessage('user', message.trim());
    this.setState({
      ...this.state,
      messages: [...this.state.messages, userMessage],
      isProcessing: true
    });
    try {
      if (!this.chatHandler) throw new Error('Chat handler not initialized');
      if (stream) {
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = createEncoder();
        (async () => {
          try {
            this.setState({ ...this.state, streamingMessage: '' });
            // Rate limiting: if no user API key, introduce a delay
            if (!apiKey) {
              const craftingMessage = "Crafting response... please wait.";
              writer.write(encoder.encode(craftingMessage));
              this.setState({ ...this.state, streamingMessage: craftingMessage });
              await delay(15000); // 15-second delay
              // Clear the crafting message before sending the real one
              // A better UX would be to replace it, but this is simpler.
              // We'll just start streaming the new message. The UI will append.
              // Let's send a clear signal or just start the new message.
              // The current UI just appends, so the crafting message will remain.
              // Let's create a new assistant message for the crafting part.
              const craftingMsg = createMessage('assistant', craftingMessage);
              this.setState({
                ...this.state,
                messages: [...this.state.messages, craftingMsg],
                streamingMessage: '',
              });
            }
            const response = await this.chatHandler!.processMessage(
              message,
              this.state.messages,
              persona,
              (chunk: string) => {
                try {
                  this.setState({
                    ...this.state,
                    streamingMessage: (this.state.streamingMessage || '') + chunk,
                  });
                  writer.write(encoder.encode(chunk));
                } catch (writeError) {
                  console.error('Write error:', writeError);
                }
              },
              apiKey
            );
            const assistantMessage = createMessage('assistant', response.content);
            this.setState({
              ...this.state,
              messages: [...this.state.messages, assistantMessage],
              isProcessing: false,
              streamingMessage: '',
            });
          } catch (error) {
            console.error('Streaming error:', error);
            const errorMessage = 'Sorry, I encountered an error.';
            writer.write(encoder.encode(errorMessage));
            const errorMsg = createMessage('assistant', errorMessage);
            this.setState({
              ...this.state,
              messages: [...this.state.messages, errorMsg],
              isProcessing: false,
              streamingMessage: '',
            });
          } finally {
            writer.close();
          }
        })();
        return createStreamResponse(readable);
      }
      // Non-streaming response
      const response = await this.chatHandler.processMessage(message, this.state.messages, persona, undefined, apiKey);
      const assistantMessage = createMessage('assistant', response.content);
      this.setState({
        ...this.state,
        messages: [...this.state.messages, assistantMessage],
        isProcessing: false
      });
      return Response.json({ success: true, data: this.state });
    } catch (error) {
      console.error('Chat processing error:', error);
      this.setState({ ...this.state, isProcessing: false });
      return Response.json({ success: false, error: API_RESPONSES.PROCESSING_ERROR }, { status: 500 });
    }
  }
  private handleClearMessages(): Response {
    this.setState({ ...this.state, messages: [] });
    return Response.json({ success: true, data: this.state });
  }
  private handleModelUpdate(body: { model: string }): Response {
    const { model } = body;
    if (!model) {
        return Response.json({ success: false, error: "Model is required" }, { status: 400 });
    }
    this.setState({ ...this.state, model });
    this.chatHandler?.updateModel(model);
    return Response.json({ success: true, data: this.state });
  }
}