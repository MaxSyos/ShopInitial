import { Injectable, Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../redis/redis.constants';
import Redis from 'ioredis';

export interface SessionData {
  userId: string;
  email: string;
  createdAt: number;
  expiresAt: number;
}

@Injectable()
export class SessionService {
  private readonly sessionPrefix = 'session:';
  private readonly sessionDuration = 30 * 24 * 60 * 60; // 30 dias em segundos

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async createSession(userId: string, email: string): Promise<string> {
    const sessionId = this.generateSessionId();
    const now = Date.now();
    
    const sessionData: SessionData = {
      userId,
      email,
      createdAt: now,
      expiresAt: now + (this.sessionDuration * 1000)
    };

    await this.redis.setex(
      `${this.sessionPrefix}${sessionId}`,
      this.sessionDuration,
      JSON.stringify(sessionData)
    );

    return sessionId;
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const data = await this.redis.get(`${this.sessionPrefix}${sessionId}`);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.redis.del(`${this.sessionPrefix}${sessionId}`);
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    const keys = await this.redis.keys(`${this.sessionPrefix}*`);
    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const session = JSON.parse(data);
        if (session.userId === userId) {
          await this.redis.del(key);
        }
      }
    }
  }

  async refreshSession(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) return false;

    const now = Date.now();
    session.expiresAt = now + (this.sessionDuration * 1000);
    
    await this.redis.setex(
      `${this.sessionPrefix}${sessionId}`,
      this.sessionDuration,
      JSON.stringify(session)
    );

    return true;
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}
