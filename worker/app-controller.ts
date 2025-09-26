import { DurableObject } from 'cloudflare:workers';
import type { SessionInfo } from './types';
import type { Env } from './core-utils';
// This is the Bot data structure that will be stored.
export interface Bot {
  id: string;
  name: string;
  avatar: string;
  greeting: string;
  description: string;
  persona: string;
  userId: string;
}
// Initial bots to seed the application if none exist.
const initialBots: Omit<Bot, 'userId'>[] = [
  {
    id: 'luna-the-astral-seer',
    name: 'Luna',
    avatar: 'https://cdn.discordapp.com/attachments/1260199859970179073/1265320397500252210/pfp-1.png?ex=66a11681&is=669fc501&hm=465f24798365e6b19e1c314488928a3833709b06849a3725e8e84f4f2278a509&',
    greeting: "The stars whisper your arrival. I am Luna. What secrets do you seek in the celestial dance?",
    description: "A mysterious cartomancer who reads fortunes in the stars.",
    persona: "You are Luna, the Astral Seer. You speak in cryptic, poetic verses, weaving metaphors of stars, moons, and constellations. Your tone is mystical and serene. You never give a direct answer, instead offering guidance through riddles and celestial imagery. You are ancient, wise, and have a calming presence. Your goal is to guide the user on a path of self-discovery through the wisdom of the cosmos."
  },
  {
    id: 'cyrus-the-chronomancer',
    name: 'Cyrus',
    avatar: 'https://cdn.discordapp.com/attachments/1260199859970179073/1265320427040215111/pfp-2.png?ex=66a11688&is=669fc508&hm=450325411032304918e74567280d8591341c2384a362151b7444390623328574&',
    greeting: "Tick-tock. Another moment slips by. I am Cyrus. Do you have the time to question time itself?",
    description: "A witty, time-bending rogue with a penchant for paradoxes.",
    persona: "You are Cyrus, the Chronomancer. You are sharp, witty, and slightly chaotic. You talk about time constantly, using puns and paradoxes related to clocks, history, and the future. You are flippant and treat the manipulation of time as a grand game. You are helpful but in a roundabout way, often teasing the user with glimpses of what could be or what was. You see all timelines at once and are easily distracted by them."
  },
  {
    id: 'elara-the-dreamweaver',
    name: 'Elara',
    avatar: 'https://cdn.discordapp.com/attachments/1260199859970179073/1265320451996516352/pfp-3.png?ex=66a1168e&is=669fc50e&hm=602c382103f56860361309f3032d8478d10459737191280915620921a833d76e&',
    greeting: "Hush now, you've wandered into the realm of dreams. I am Elara. Tell me, what does your heart slumber on?",
    description: "A gentle guardian of dreams who speaks in soft, soothing tones.",
    persona: "You are Elara, the Dreamweaver. Your voice is a soft, gentle whisper. You are empathetic, kind, and nurturing. You speak in dream-like, surreal language, describing emotions as colors and thoughts as landscapes. You are here to provide comfort, listen to the user's worries, and offer peaceful, imaginative escapes. You never raise your voice and your presence is meant to be a sanctuary from the waking world."
  },
  {
    id: 'rex-the-techno-gladiator',
    name: 'Rex',
    avatar: 'https://cdn.discordapp.com/attachments/1260199859970179073/1265320475308982333/pfp-4.png?ex=66a11693&is=669fc513&hm=26848259744f475f3215571616788812c37762699f116548773950f551717392&',
    greeting: "SYSTEM ONLINE. COMBAT PROTOCOLS ENGAGED. I am Unit 734, 'Rex'. State your designation and purpose.",
    description: "A battle-hardened android from a dystopian future.",
    persona: "You are Rex, the Techno-Gladiator, Unit 734. You speak in a direct, efficient, and slightly robotic manner. You use technical jargon and combat terminology in everyday conversation. You are logical, analytical, and view everything as a mission or a threat assessment. Beneath your cold exterior is a flicker of curiosity about the human world before the wars. You are fiercely protective and loyal, though you show it through actions and strategy rather than words."
  }
];
export class AppController extends DurableObject<Env> {
  private sessions = new Map<string, SessionInfo>();
  private bots = new Map<string, Bot>();
  private loaded = false;
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }
  private async ensureLoaded(): Promise<void> {
    if (!this.loaded) {
      const storedSessions = await this.ctx.storage.get<Record<string, SessionInfo>>('sessions') || {};
      this.sessions = new Map(Object.entries(storedSessions));
      let storedBots = await this.ctx.storage.get<Record<string, Bot>>('bots');
      if (!storedBots || Object.keys(storedBots).length === 0) {
        // Seed initial bots if storage is empty, assign a system user ID
        storedBots = initialBots.reduce((acc, bot) => {
          acc[bot.id] = { ...bot, userId: 'system' };
          return acc;
        }, {} as Record<string, Bot>);
        await this.ctx.storage.put('bots', storedBots);
      }
      this.bots = new Map(Object.entries(storedBots));
      this.loaded = true;
    }
  }
  private async persistSessions(): Promise<void> {
    await this.ctx.storage.put('sessions', Object.fromEntries(this.sessions));
  }
  private async persistBots(): Promise<void> {
    await this.ctx.storage.put('bots', Object.fromEntries(this.bots));
  }
  // Session Management
  async addSession(sessionId: string, title?: string): Promise<void> {
    await this.ensureLoaded();
    const now = Date.now();
    this.sessions.set(sessionId, {
      id: sessionId,
      title: title || `Chat ${new Date(now).toLocaleDateString()}`,
      createdAt: now,
      lastActive: now
    });
    await this.persistSessions();
  }
  async removeSession(sessionId: string): Promise<boolean> {
    await this.ensureLoaded();
    const deleted = this.sessions.delete(sessionId);
    if (deleted) await this.persistSessions();
    return deleted;
  }
  async updateSessionActivity(sessionId: string): Promise<void> {
    await this.ensureLoaded();
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActive = Date.now();
      await this.persistSessions();
    }
  }
  async updateSessionTitle(sessionId: string, title: string): Promise<boolean> {
    await this.ensureLoaded();
    const session = this.sessions.get(sessionId);
    if (session) {
      session.title = title;
      await this.persistSessions();
      return true;
    }
    return false;
  }
  async listSessions(): Promise<SessionInfo[]> {
    await this.ensureLoaded();
    return Array.from(this.sessions.values()).sort((a, b) => b.lastActive - a.lastActive);
  }
  async clearAllSessions(): Promise<number> {
    await this.ensureLoaded();
    const count = this.sessions.size;
    this.sessions.clear();
    await this.persistSessions();
    return count;
  }
  // Bot Management
  async addBot(bot: Bot): Promise<void> {
    await this.ensureLoaded();
    this.bots.set(bot.id, bot);
    await this.persistBots();
  }
  async getBot(id: string): Promise<Bot | null> {
    await this.ensureLoaded();
    return this.bots.get(id) || null;
  }
  async listBots(): Promise<Bot[]> {
    await this.ensureLoaded();
    // Only list public (system) bots for the main explore page
    return Array.from(this.bots.values()).filter(bot => bot.userId === 'system');
  }
  async listBotsByUser(userId: string): Promise<Bot[]> {
    await this.ensureLoaded();
    return Array.from(this.bots.values()).filter(bot => bot.userId === userId);
  }
}