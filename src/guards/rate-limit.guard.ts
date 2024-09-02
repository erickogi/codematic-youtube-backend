import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RateLimitGuard implements CanActivate {
    constructor(
        private redisService: RedisService,
        private configService: ConfigService,
    ) { }
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const ip = request.ip;
        const key = `rateLimit:${ip}`;
        const limit = this.configService.get<number>('ratelimitMax');
        const ttl = this.configService.get<number>('ratelimitWindow');
        const current = await this.redisService.incr(key);
        if (current === 1) {
            await this.redisService.expire(key, ttl);
        }
        if (current > limit) {
            throw new HttpException('Too Many Requests, Limit reached', HttpStatus.TOO_MANY_REQUESTS);
        }
        return true;
    }
}