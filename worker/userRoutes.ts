import { Hono } from "hono";
import { getAgentByName } from 'agents';
import { ChatAgent } from './agent';
import { API_RESPONSES } from './config';
import { Env, getAppController, registerSession, unregisterSession } from "./core-utils";
import type { Bot } from './app-controller';
import { clerkAuthMiddleware } from './auth';
/**
 * DO NOT MODIFY THIS FUNCTION. Only for your reference.
 */
export function coreRoutes(app: Hono<{ Bindings: Env }>) {
    // Secure the chat agent routes
    app.use('/api/chat/:sessionId/*', clerkAuthMiddleware);
    // Use this API for conversations. **DO NOT MODIFY**
    app.all('/api/chat/:sessionId/*', async (c) => {
        try {
        const sessionId = c.req.param('sessionId');
        const agent = await getAgentByName<Env, ChatAgent>(c.env.CHAT_AGENT, sessionId); // Get existing agent or create a new one if it doesn't exist, with sessionId as the name
        const url = new URL(c.req.url);
        url.pathname = url.pathname.replace(`/api/chat/${sessionId}`, '');
        return agent.fetch(new Request(url.toString(), {
            method: c.req.method,
            headers: c.req.header(),
            body: c.req.method === 'GET' || c.req.method === 'DELETE' ? undefined : c.req.raw.body
        }));
        } catch (error) {
        console.error('Agent routing error:', error);
        return c.json({
            success: false,
            error: API_RESPONSES.AGENT_ROUTING_FAILED
        }, { status: 500 });
        }
    });
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    // Public route to list bots
    app.get('/api/v1/bots', async (c) => {
        try {
            const controller = getAppController(c.env);
            const bots = await controller.listBots();
            return c.json({ success: true, data: bots });
        } catch (error) {
            console.error('Failed to list bots:', error);
            return c.json({ success: false, error: 'Failed to retrieve bots' }, { status: 500 });
        }
    });
    // Public route to get a single bot's details
    app.get('/api/v1/bots/:id', async (c) => {
        try {
            const { id } = c.req.param();
            const controller = getAppController(c.env);
            const bot = await controller.getBot(id);
            if (!bot) {
                return c.json({ success: false, error: 'Bot not found' }, { status: 404 });
            }
            return c.json({ success: true, data: bot });
        } catch (error) {
            console.error(`Failed to get bot ${c.req.param('id')}:`, error);
            return c.json({ success: false, error: 'Failed to retrieve bot' }, { status: 500 });
        }
    });
    // Secure all other bot and session management routes
    app.use('/api/v1/bots', clerkAuthMiddleware);
    app.use('/api/v1/user/bots', clerkAuthMiddleware);
    app.use('/api/sessions', clerkAuthMiddleware);
    app.use('/api/sessions/*', clerkAuthMiddleware);
    // Bot Management Routes (Authenticated)
    app.post('/api/v1/bots', async (c) => {
        const auth = c.get('clerkAuth');
        if (!auth?.userId) {
            return c.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        try {
            const body = await c.req.json();
            if (!body.name || !body.avatar || !body.description || !body.greeting || !body.persona) {
                return c.json({ success: false, error: 'Missing required fields' }, { status: 400 });
            }
            const slug = body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            const uniqueId = `${slug}-${crypto.randomUUID().slice(0, 4)}`;
            const newBot: Bot = {
                id: uniqueId,
                name: body.name,
                avatar: body.avatar,
                description: body.description,
                greeting: body.greeting,
                persona: body.persona,
                userId: auth.userId,
            };
            const controller = getAppController(c.env);
            await controller.addBot(newBot);
            return c.json({ success: true, data: newBot }, { status: 201 });
        } catch (error) {
            console.error('Failed to create bot:', error);
            return c.json({ success: false, error: 'Failed to create bot' }, { status: 500 });
        }
    });
    app.get('/api/v1/user/bots', async (c) => {
        const auth = c.get('clerkAuth');
        if (!auth?.userId) {
            return c.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        try {
            const controller = getAppController(c.env);
            const bots = await controller.listBotsByUser(auth.userId);
            return c.json({ success: true, data: bots });
        } catch (error) {
            console.error('Failed to list user bots:', error);
            return c.json({ success: false, error: 'Failed to retrieve user bots' }, { status: 500 });
        }
    });
    // Session Management Routes (Authenticated)
    app.get('/api/sessions', async (c) => {
        try {
            const controller = getAppController(c.env);
            const sessions = await controller.listSessions();
            return c.json({ success: true, data: sessions });
        } catch (error) {
            console.error('Failed to list sessions:', error);
            return c.json({
                success: false,
                error: 'Failed to retrieve sessions'
            }, { status: 500 });
        }
    });
    app.post('/api/sessions', async (c) => {
        try {
            const body = await c.req.json().catch(() => ({}));
            const { title, sessionId: providedSessionId, firstMessage, botId } = body;
            const sessionId = providedSessionId || crypto.randomUUID();
            let sessionTitle = title;
            if (!sessionTitle) {
                const now = new Date();
                const dateTime = now.toLocaleString([], {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                if (firstMessage && firstMessage.trim()) {
                    const cleanMessage = firstMessage.trim().replace(/\s+/g, ' ');
                    const truncated = cleanMessage.length > 40
                        ? cleanMessage.slice(0, 37) + '...'
                        : cleanMessage;
                    sessionTitle = `${truncated} — ${dateTime}`;
                } else {
                    sessionTitle = `Chat ${dateTime}`;
                }
            }
            await registerSession(c.env, sessionId, sessionTitle);
            if (botId) {
                const agent = await getAgentByName<Env, ChatAgent>(c.env.CHAT_AGENT, sessionId);
                await agent.fetch(new Request(`http://agent/set-bot-id`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ botId })
                }));
            }
            return c.json({
                success: true,
                data: { sessionId, title: sessionTitle }
            });
        } catch (error) {
            console.error('Failed to create session:', error);
            return c.json({
                success: false,
                error: 'Failed to create session'
            }, { status: 500 });
        }
    });
    app.delete('/api/sessions/:sessionId', async (c) => {
        try {
            const sessionId = c.req.param('sessionId');
            const deleted = await unregisterSession(c.env, sessionId);
            if (!deleted) {
                return c.json({
                    success: false,
                    error: 'Session not found'
                }, { status: 404 });
            }
            return c.json({ success: true, data: { deleted: true } });
        } catch (error) {
            console.error('Failed to delete session:', error);
            return c.json({
                success: false,
                error: 'Failed to delete session'
            }, { status: 500 });
        }
    });
    app.put('/api/sessions/:sessionId/title', async (c) => {
        try {
            const sessionId = c.req.param('sessionId');
            const { title } = await c.req.json();
            if (!title || typeof title !== 'string') {
                return c.json({
                    success: false,
                    error: 'Title is required'
                }, { status: 400 });
            }
            const controller = getAppController(c.env);
            const updated = await controller.updateSessionTitle(sessionId, title);
            if (!updated) {
                return c.json({
                    success: false,
                    error: 'Session not found'
                }, { status: 404 });
            }
            return c.json({ success: true, data: { title } });
        } catch (error) {
            console.error('Failed to update session title:', error);
            return c.json({
                success: false,
                error: 'Failed to update session title'
            }, { status: 500 });
        }
    });
    app.delete('/api/sessions', async (c) => {
        try {
            const controller = getAppController(c.env);
            const deletedCount = await controller.clearAllSessions();
            return c.json({
                success: true,
                data: { deletedCount }
            });
        } catch (error) {
            console.error('Failed to clear all sessions:', error);
            return c.json({
                success: false,
                error: 'Failed to clear all sessions'
            }, { status: 500 });
        }
    });
}