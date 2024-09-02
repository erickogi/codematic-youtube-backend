import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly redisClient: Redis;
  constructor(private configService: ConfigService) {
    this.redisClient = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
      retryStrategy: (times) => {
        if (times > 10) {
          this.logger.error(`Redis connection failed after ${times} attempts`);
          return null;
        }
        return Math.min(times * 100, 3000);
      },
      maxRetriesPerRequest: 10,
      socketTimeout: 150000,
    });
  }

  public retryStrategy(times: number): number | null {
    if (times > 10) {
      this.logger.error(`Redis connection failed after ${times} attempts`);
      return null;
    }
    return Math.min(times * 100, 3000);
  }

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async set(key: string, value: string, duration: number): Promise<void> {
    await this.redisClient.set(key, value, 'EX', duration);
  }

  async incr(key: string): Promise<number> {
    return this.redisClient.incr(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.redisClient.expire(key, seconds);
  }
}