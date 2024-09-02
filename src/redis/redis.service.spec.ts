import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

jest.mock('ioredis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({
      get: jest.fn(),
      set: jest.fn(),
      incr: jest.fn(),
      expire: jest.fn(),
    })),
  };
});

describe('RedisService', () => {
  let service: RedisService;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockRedisClient: jest.Mocked<Redis>;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    mockRedisClient = (service as any).redisClient;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should create Redis client with correct configuration', () => {
      mockConfigService.get.mockReturnValueOnce('localhost')
        .mockReturnValueOnce(6379)
        .mockReturnValueOnce('password');

      new RedisService(mockConfigService);

      expect(Redis).toHaveBeenCalledWith(expect.objectContaining({
        host: 'localhost',
        port: 6379,
        password: 'password',
        maxRetriesPerRequest: 10,
        socketTimeout: 150000,
      }));
    });
  });

  describe('retryStrategy', () => {

    it('should return null after 10 attempts', () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

      expect(service.retryStrategy(11)).toBeNull();
      expect(loggerSpy).toHaveBeenCalledWith('Redis connection failed after 11 attempts');
    });
  });

  describe('get', () => {
    it('should call Redis get method', async () => {
      mockRedisClient.get.mockResolvedValue('value');

      const result = await service.get('key');

      expect(result).toBe('value');
      expect(mockRedisClient.get).toHaveBeenCalledWith('key');
    });

    it('should return null for non-existent key', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.get('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should call Redis set method with expiration', async () => {
      mockRedisClient.set.mockResolvedValue('OK');

      await service.set('key', 'value', 60);

      expect(mockRedisClient.set).toHaveBeenCalledWith('key', 'value', 'EX', 60);
    });
  });

  describe('incr', () => {
    it('should call Redis incr method', async () => {
      mockRedisClient.incr.mockResolvedValue(1);

      const result = await service.incr('counter');

      expect(result).toBe(1);
      expect(mockRedisClient.incr).toHaveBeenCalledWith('counter');
    });
  });

  describe('expire', () => {
    it('should call Redis expire method', async () => {
      mockRedisClient.expire.mockResolvedValue(1);

      const result = await service.expire('key', 60);

      expect(result).toBe(1);
      expect(mockRedisClient.expire).toHaveBeenCalledWith('key', 60);
    });
  });
});