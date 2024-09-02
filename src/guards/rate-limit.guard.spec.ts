import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitGuard } from './rate-limit.guard';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext, HttpException } from '@nestjs/common';

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;
  let redisService: jest.Mocked<RedisService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitGuard,
        {
          provide: RedisService,
          useValue: {
            incr: jest.fn(),
            expire: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RateLimitGuard>(RateLimitGuard);
    redisService = module.get(RedisService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockContext: ExecutionContext;

    beforeEach(() => {
      mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({ ip: '127.0.0.1' }),
        }),
      } as unknown as ExecutionContext;

      configService.get.mockReturnValueOnce(10).mockReturnValueOnce(60);
    });

    it('should allow request when under the rate limit', async () => {
      redisService.incr.mockResolvedValue(5);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(redisService.incr).toHaveBeenCalledWith('rateLimit:127.0.0.1');
      expect(redisService.expire).not.toHaveBeenCalled();
    });

    it('should set expiry on first request', async () => {
      redisService.incr.mockResolvedValue(1);

      await guard.canActivate(mockContext);

      expect(redisService.expire).toHaveBeenCalledWith('rateLimit:127.0.0.1', 60);
    });

    it('should throw HttpException when rate limit is exceeded', async () => {
      redisService.incr.mockResolvedValue(110);
      await expect(guard.canActivate(mockContext)).rejects.toThrow(HttpException);
    });

    it('should use correct rate limit values from config', async () => {
      configService.get.mockReset();
      configService.get.mockReturnValueOnce(5).mockReturnValueOnce(30);
      redisService.incr.mockResolvedValue(6);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(HttpException);
      expect(configService.get).toHaveBeenCalledWith('ratelimitMax');
      expect(configService.get).toHaveBeenCalledWith('ratelimitWindow');
    });

    it('should handle different IP addresses separately', async () => {
      redisService.incr.mockResolvedValueOnce(5).mockResolvedValueOnce(1);

      await guard.canActivate(mockContext);
      expect(redisService.incr).toHaveBeenCalledWith('rateLimit:127.0.0.1');

      const newMockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({ ip: '192.168.0.1' }),
        }),
      } as unknown as ExecutionContext;

      await guard.canActivate(newMockContext);
      expect(redisService.incr).toHaveBeenCalledWith('rateLimit:192.168.0.1');
      expect(redisService.expire).toHaveBeenCalledWith('rateLimit:192.168.0.1', undefined);
    });
  });
});