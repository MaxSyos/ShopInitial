import { Injectable } from '@nestjs/common';
import { RedisService } from '../modules/redis/redis.service';

interface BaseSessionData {
  userId: string;
  email: string;
  data?: Record<string, any>;
  lastAccess?: string;
}

interface SessionWithId extends BaseSessionData {
  id: string;
}

@Injectable()
export class SessionService {
  private readonly SESSION_PREFIX = 'session:';
  private readonly SESSION_TTL = 60 * 60 * 24 * 7; // 7 dias

  constructor(private readonly redisService: RedisService) {}

  async createSession(userId: string, sessionData: any): Promise<string> {
    const sessionId = `${this.SESSION_PREFIX}${userId}:${Date.now()}`;
    const sessionInfo: BaseSessionData = {
      ...sessionData,
      userId,
      email: sessionData.email,
      lastAccess: new Date().toISOString(),
    };

    await this.redisService.set(
      sessionId,
      JSON.stringify(sessionInfo),
      this.SESSION_TTL,
    );

    return sessionId;
  }

  async getSession(sessionId: string): Promise<BaseSessionData | null> {
    const sessionData = await this.redisService.get(sessionId);
    if (!sessionData) {
      return null;
    }

    const session = JSON.parse(sessionData);
    session.lastAccess = new Date().toISOString();

    await this.redisService.set(
      sessionId,
      JSON.stringify(session),
      this.SESSION_TTL,
    );

    return session;
  }

  async updateSession(
    sessionId: string,
    updates: Partial<BaseSessionData>,
  ): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return false;
    }

    const updatedSession = {
      ...session,
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
    return this.redisService.del(sessionId);
  }

  async getAllUserSessions(userId: string): Promise<SessionWithId[]> {
    const pattern = `${this.SESSION_PREFIX}${userId}:*`;
    const keys = await this.redisService.keys(pattern);
    const sessions: SessionWithId[] = [];

    for (const key of keys) {
      const data = await this.redisService.get(key);
      if (data) {
        const session = JSON.parse(data);
        sessions.push({ ...session, id: key.replace(this.SESSION_PREFIX, '') });
      }
    }

    return sessions;
  }

  async removeAllUserSessions(userId: string): Promise<number> {
    const pattern = `${this.SESSION_PREFIX}${userId}:*`;
    const keys = await this.redisService.keys(pattern);
    let count = 0;

    for (const key of keys) {
      const deleted = await this.redisService.del(key);
      if (deleted) count++;
    }

    return count;
  }
}
