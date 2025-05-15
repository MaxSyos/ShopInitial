import { DistributedCacheService } from './distributed-cache.service';

interface SessionData {
  userId: string;
  email: string;
  createdAt: number;
  expiresAt: number;
}

export class SessionService {
  private readonly cache: DistributedCacheService;
  private readonly sessionDuration: number = 30 * 24 * 60 * 60; // 30 dias em segundos

  constructor() {
    this.cache = new DistributedCacheService();
  }

  async createSession(userId: string, email: string): Promise<string> {
    const sessionId = this.generateSessionId();
    const now = Date.now();
    
    const sessionData: SessionData = {
      userId,
      email,
      createdAt: now,
      expiresAt: now + (this.sessionDuration * 1000)
    };

    await this.cache.set(`session:${sessionId}`, sessionData, this.sessionDuration);
    return sessionId;
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    return await this.cache.get<SessionData>(`session:${sessionId}`);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.cache.del(`session:${sessionId}`);
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    await this.cache.delByPattern(`session:*:${userId}`);
  }

  async refreshSession(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) return false;

    const now = Date.now();
    session.expiresAt = now + (this.sessionDuration * 1000);
    
    await this.cache.set(`session:${sessionId}`, session, this.sessionDuration);
    return true;
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}
