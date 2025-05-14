import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { REDIS_OPTIONS } from './redis.constants';
import { RedisOptions } from './interfaces/redis-options.interface';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: RedisClientType;
  private isConnected: boolean = false;

  constructor(@Inject(REDIS_OPTIONS) private readonly options: RedisOptions) {
    this.client = createClient({
      socket: {
        host: this.options.host,
        port: this.options.port,
        reconnectStrategy: this.options.retryStrategy,
      },
      password: this.options.password,
      database: this.options.db,
      keyPrefix: this.options.keyPrefix,
      maxRetriesPerRequest: this.options.maxRetriesPerRequest,
      disableOfflineQueue: true,
    });

    this.client.on('connect', () => {
      console.log('Redis client connected');
      this.isConnected = true;
    });

    this.client.on('error', (err) => {
      console.error('Redis client error:', err);
      this.isConnected = false;
    });

    this.client.connect();
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  async hGet(key: string, field: string): Promise<string | null> {
    return this.client.hGet(key, field);
  }

  async hSet(key: string, field: string, value: string): Promise<void> {
    await this.client.hSet(key, field, value);
  }

  async hDel(key: string, field: string): Promise<void> {
    await this.client.hDel(key, field);
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    return this.client.hGetAll(key);
  }

  getClient(): RedisClientType {
    return this.client;
  }

  isReady(): boolean {
    return this.isConnected;
  }
}
