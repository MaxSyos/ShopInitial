import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class SessionService {
  private readonly SESSION_PREFIX = 'session:';
  private readonly SESSION_TTL = 60 * 60 * 24 * 7; // 7 dias

  constructor(private readonly redisService: RedisService) {}

  async createSession(userId: string, sessionData: any): Promise<string> {
    const sessionId = `${this.SESSION_PREFIX}${userId}:${Date.now()}`;
    const sessionInfo = {
      ...sessionData,
      userId,
      createdAt: new Date().toISOString(),
      lastAccess: new Date().toISOString(),
    };

    await this.redisService.set(
      sessionId,
      JSON.stringify(sessionInfo),
      this.SESSION_TTL,
    );

    return sessionId;
  }

  async getSession(sessionId: string): Promise<any | null> {
    const sessionData = await this.redisService.get(sessionId);
    if (!sessionData) {
      return null;
    }

    const session = JSON.parse(sessionData);
    session.lastAccess = new Date().toISOString();

    // Atualiza o último acesso e renova o TTL
    await this.redisService.set(
      sessionId,
      JSON.stringify(session),
      this.SESSION_TTL,
    );

    return session;
  }

  async updateSession(sessionId: string, updates: any): Promise<boolean> {
    const currentSession = await this.getSession(sessionId);
    if (!currentSession) {
      return false;
    }

    const updatedSession = {
      ...currentSession,
      ...updates,
      lastAccess: new Date().toISOString(),
    };

    await this.redisService.set(
      sessionId,
      JSON.stringify(updatedSession),
      this.SESSION_TTL,
    );

    return true;
  }

  async removeSession(sessionId: string): Promise<boolean> {
    const exists = await this.redisService.get(sessionId);
    if (!exists) {
      return false;
    }

    await this.redisService.del(sessionId);
    return true;
  }

  async getAllUserSessions(userId: string): Promise<any[]> {
    const pattern = `${this.SESSION_PREFIX}${userId}:*`;
    const sessionKeys = await this.redisService.keys(pattern);
    
    const sessions = await Promise.all(
      sessionKeys.map(async (key) => {
        const session = await this.getSession(key);
        return session ? { ...session, id: key } : null;
      }),
    );

    return sessions.filter(Boolean);
  }

  async removeAllUserSessions(userId: string): Promise<number> {
    const pattern = `${this.SESSION_PREFIX}${userId}:*`;
    const sessionKeys = await this.redisService.keys(pattern);
    
    await Promise.all(
      sessionKeys.map((key) => this.redisService.del(key)),
    );

    return sessionKeys.length;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const pattern = `${this.SESSION_PREFIX}*`;
    const sessionKeys = await this.redisService.keys(pattern);
    let removed = 0;

    for (const key of sessionKeys) {
      const session = await this.redisService.get(key);
      if (!session) {
        await this.redisService.del(key);
        removed++;
      }
    }

    return removed;
  }
}
