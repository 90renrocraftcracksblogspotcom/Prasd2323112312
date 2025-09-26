import { Hono } from 'hono';
import { handle } from 'hono/vercel';
export const config = {
  runtime: 'edge',
};
const app = new Hono().basePath('/api');
// This is a basic Vercel-compatible API route demonstrating how to proxy to NVIDIA.
// It uses the same streaming logic as the Cloudflare Worker for consistency.
// The NVIDIA_API_KEY would need to be set as an environment variable in Vercel.
app.post('/chat', async (c) => {
  try {
    const { messages, model = 'deepseek-ai/deepseek-v3.1' } = await c.req.json();
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return c.json({ error: 'NVIDIA_API_KEY is not configured' }, 500);
    }
    const nvidiaResponse = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        top_p: 1,
        max_tokens: 1024,
        stream: true,
      }),
    });
    if (!nvidiaResponse.ok || !nvidiaResponse.body) {
      const errorText = await nvidiaResponse.text();
      console.error("NVIDIA API Error:", errorText);
      return c.json({ error: `NVIDIA API Error: ${nvidiaResponse.status} ${errorText}` }, nvidiaResponse.status);
    }
    // Return the streaming response directly to the client
    return new Response(nvidiaResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in Vercel chat proxy:', error);
    return c.json({ error: 'An internal error occurred.' }, 500);
  }
});
export default handle(app);