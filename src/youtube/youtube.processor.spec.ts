import { Test, TestingModule } from '@nestjs/testing';
import { YouTubeProcessor } from './youtube.processor';
import { YouTubeService } from './youtube.service';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';

describe('YouTubeProcessor', () => {
  let youtubeProcessor: YouTubeProcessor;
  let youtubeService: jest.Mocked<YouTubeService>;

  beforeEach(async () => {
    const mockYouTubeService = {
      getVideoComments: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YouTubeProcessor,
        { provide: YouTubeService, useValue: mockYouTubeService },
      ],
    }).compile();

    youtubeProcessor = module.get<YouTubeProcessor>(YouTubeProcessor);
    youtubeService = module.get(YouTubeService);
  });

  describe('handleFetchNextPage', () => {
    it('should call getVideoComments with correct parameters', async () => {
      const job = {
        data: {
          videoId: 'testVideoId',
          pageToken: 'testPageToken',
          maxResults: 50,
        },
      } as Job;

      await youtubeProcessor.handleFetchNextPage(job);

      expect(youtubeService.getVideoComments).toHaveBeenCalledWith({
        videoId: 'testVideoId',
        maxResults: 50,
        pageToken: 'testPageToken',
      });
    });

    it('should handle job with missing pageToken', async () => {
      const job = {
        data: {
          videoId: 'testVideoId',
          maxResults: 50,
        },
      } as Job;

      await youtubeProcessor.handleFetchNextPage(job);

      expect(youtubeService.getVideoComments).toHaveBeenCalledWith({
        videoId: 'testVideoId',
        maxResults: 50,
        pageToken: undefined,
      });
    });

    it('should handle job with missing maxResults', async () => {
      const job = {
        data: {
          videoId: 'testVideoId',
          pageToken: 'testPageToken',
        },
      } as Job;

      await youtubeProcessor.handleFetchNextPage(job);

      expect(youtubeService.getVideoComments).toHaveBeenCalledWith({
        videoId: 'testVideoId',
        maxResults: undefined,
        pageToken: 'testPageToken',
      });
    });

    it('should throw an error if videoId is missing', async () => {
      const job = {
        data: {
          pageToken: 'testPageToken',
          maxResults: 50,
        },
      } as Job;

      await expect(youtubeProcessor.handleFetchNextPage(job)).rejects.toThrow(
        'VideoId is invalid or missing'
      );
    });

    it('should throw an error if videoId is an empty string', async () => {
      const job = {
        data: {
          videoId: '',
          pageToken: 'testPageToken',
          maxResults: 50,
        },
      } as Job;

      await expect(youtubeProcessor.handleFetchNextPage(job)).rejects.toThrow(
        'VideoId is invalid or missing'
      );
    });

    it('should throw an error if videoId is null', async () => {
      const job = {
        data: {
          videoId: null,
          pageToken: 'testPageToken',
          maxResults: 50,
        },
      } as Job;

      await expect(youtubeProcessor.handleFetchNextPage(job)).rejects.toThrow(
        'VideoId is invalid or missing'
      );
    });

    it('should log debug messages', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'debug');
      const job = {
        data: {
          videoId: 'testVideoId',
          pageToken: 'testPageToken',
          maxResults: 50,
        },
      } as Job;

      await youtubeProcessor.handleFetchNextPage(job);

      expect(loggerSpy).toHaveBeenCalledWith('Start fetching next page');
      expect(loggerSpy).toHaveBeenCalledWith('Finished fetching next page');
    });

    it('should handle getVideoComments throwing an error', async () => {
      const job = {
        data: {
          videoId: 'testVideoId',
          pageToken: 'testPageToken',
          maxResults: 50,
        },
      } as Job;

      const error = new Error('API Error');
      youtubeService.getVideoComments.mockRejectedValue(error);

      await expect(youtubeProcessor.handleFetchNextPage(job)).rejects.toThrow('API Error');
    });

    it('should handle negative maxResults value', async () => {
      const job = {
        data: {
          videoId: 'testVideoId',
          pageToken: 'testPageToken',
          maxResults: -10,
        },
      } as Job;

      await expect(youtubeProcessor.handleFetchNextPage(job)).rejects.toThrow(
        'Invalid maxResults value'
      );
    });

    it('should handle empty string values', async () => {
      const job = {
        data: {
          videoId: '',
          pageToken: '',
          maxResults: 50,
        },
      } as Job;

      await expect(youtubeProcessor.handleFetchNextPage(job)).rejects.toThrow(
        'VideoId is invalid or missing'
      );
    });

  });
});