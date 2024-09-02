import { Test, TestingModule } from '@nestjs/testing';
import { YouTubeController } from './youtube.controller';
import { YouTubeService } from './youtube.service';
import { RateLimitGuard } from '../guards/rate-limit.guard';
import { VideoDetailsDto } from './dto/video-details.dto';
import { CommentsResponseDto } from './dto/multi_comments.dto';
import { YouTubeCommentsRequestDto } from './dto/comments-request.dto';
import { BadRequestException, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';

describe('YouTubeController', () => {
  let controller: YouTubeController;
  let youtubeService: jest.Mocked<YouTubeService>;
  let rateLimitGuard: RateLimitGuard;

  const mockYouTubeService = {
    getVideoDetails: jest.fn(),
    getVideoComments: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockRedisService = {
    incr: jest.fn(),
    expire: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [YouTubeController],
      providers: [
        {
          provide: YouTubeService,
          useValue: mockYouTubeService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        RateLimitGuard,
      ],
    }).compile();

    controller = module.get<YouTubeController>(YouTubeController);
    youtubeService = module.get(YouTubeService);
    rateLimitGuard = module.get<RateLimitGuard>(RateLimitGuard);
  });

  describe('getVideoDetails', () => {
    const mockVideoDetails: VideoDetailsDto = {
      title: 'Test Video',
      description: 'Test Description',
      viewCount: 1000000,
      likeCount: 10000,
    };

    it('should return video details for a valid ID', async () => {
      youtubeService.getVideoDetails.mockResolvedValue(mockVideoDetails);

      const result = await controller.getVideoDetails('testId');
      expect(result).toEqual(mockVideoDetails);
      expect(youtubeService.getVideoDetails).toHaveBeenCalledWith('testId');
    });

    it('should throw NotFoundException for non-existent video ID', async () => {
      youtubeService.getVideoDetails.mockRejectedValue(new NotFoundException('Video not found'));

      await expect(controller.getVideoDetails('nonExistentId')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid video ID format', async () => {
      youtubeService.getVideoDetails.mockRejectedValue(new BadRequestException('Invalid video ID format'));

      await expect(controller.getVideoDetails('invalid@id')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getVideoComments', () => {
    const mockCommentsResponse: CommentsResponseDto = {
      comments: [
        { id: 'commentId1', text: 'Test comment 1', author: 'User1', publishedAt: '2024-09-01T12:00:00Z', likeCount: 10, replyCount: 2 },
        { id: 'commentId2', text: 'Test comment 2', author: 'User2', publishedAt: '2024-09-01T13:00:00Z', likeCount: 5, replyCount: 0 },
      ],
      nextPageToken: 'nextPageToken',
      pageInfo: {
        totalResults: 100,
        resultsPerPage: 20,
      },
    };

    it('should return comments for valid query params', async () => {
      youtubeService.getVideoComments.mockResolvedValue(mockCommentsResponse);

      const result = await controller.getVideoComments({ videoId: 'testVideoId', maxResults: 20 });
      expect(result).toEqual(mockCommentsResponse);
      expect(youtubeService.getVideoComments).toHaveBeenCalledWith({ videoId: 'testVideoId', maxResults: 20 });
    });

    it('should throw BadRequestException for missing videoId', async () => {
      await expect(controller.getVideoComments({ maxResults: 20 } as any)).rejects.toThrow(BadRequestException);
    });

    it('should use default maxResults if not provided', async () => {
      youtubeService.getVideoComments.mockResolvedValue(mockCommentsResponse);

      await controller.getVideoComments({ videoId: 'testVideoId' } as YouTubeCommentsRequestDto);
      expect(youtubeService.getVideoComments).toHaveBeenCalledWith({ videoId: 'testVideoId', maxResults: 20 });
    });

    it('should throw BadRequestException for invalid maxResults (above maximum)', async () => {
      await expect(controller.getVideoComments({ videoId: 'testVideoId', maxResults: 101 })).rejects.toThrow(BadRequestException);
    });

    it('should pass through pageToken when provided', async () => {
      youtubeService.getVideoComments.mockResolvedValue(mockCommentsResponse);

      await controller.getVideoComments({ videoId: 'testVideoId', maxResults: 20, pageToken: 'testToken' });
      expect(youtubeService.getVideoComments).toHaveBeenCalledWith({ videoId: 'testVideoId', maxResults: 20, pageToken: 'testToken' });
    });

    it('should throw NotFoundException for non-existent video ID', async () => {
      youtubeService.getVideoComments.mockRejectedValue(new NotFoundException('Video not found'));
      await expect(controller.getVideoComments({ videoId: 'nonExistentId' })).rejects.toThrow(NotFoundException);
    });

    it('should handle empty comments response', async () => {
      const emptyResponse: CommentsResponseDto = {
        comments: [],
        nextPageToken: null,
        pageInfo: {
          totalResults: 0,
          resultsPerPage: 20,
        },
      };
      youtubeService.getVideoComments.mockResolvedValue(emptyResponse);

      const result = await controller.getVideoComments({ videoId: 'testVideoId' });
      expect(result).toEqual(emptyResponse);
    });

    it('should handle maximum allowed maxResults', async () => {
      youtubeService.getVideoComments.mockResolvedValue(mockCommentsResponse);

      await controller.getVideoComments({ videoId: 'testVideoId', maxResults: 100 });
      expect(youtubeService.getVideoComments).toHaveBeenCalledWith({ videoId: 'testVideoId', maxResults: 100 });
    });
  });

  describe('RateLimitGuard', () => {
    it('should allow request when rate limit is not exceeded', async () => {
      mockConfigService.get.mockReturnValueOnce(10).mockReturnValueOnce(60);
      mockRedisService.incr.mockResolvedValue(5);

      const canActivate = await rateLimitGuard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({ ip: '127.0.0.1' }),
        }),
      } as any);

      expect(canActivate).toBe(true);
    });

    it('should throw HttpException when rate limit is exceeded', async () => {
      mockConfigService.get.mockReturnValueOnce(10).mockReturnValueOnce(60);
      mockRedisService.incr.mockResolvedValue(11);

      await expect(
        rateLimitGuard.canActivate({
          switchToHttp: () => ({
            getRequest: () => ({ ip: '127.0.0.1' }),
          }),
        } as any)
      ).rejects.toThrow(HttpException);
    });

    it('should set expiry on first request', async () => {
      mockConfigService.get.mockReturnValueOnce(10).mockReturnValueOnce(60);
      mockRedisService.incr.mockResolvedValue(1);

      await rateLimitGuard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({ ip: '127.0.0.1' }),
        }),
      } as any);

      expect(mockRedisService.expire).toHaveBeenCalledWith('rateLimit:127.0.0.1', 60);
    });
  });
});