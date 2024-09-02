// File: youtube.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { YouTubeService } from './youtube.service';
import { RedisService } from '../redis/redis.service';
import { getQueueToken } from '@nestjs/bull';
import { HttpException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { YouTubeCommentsRequestDto } from './dto/comments-request.dto';
import { CommentsResponseDto } from './dto/multi_comments.dto';

jest.mock('axios');

describe('YouTubeService', () => {
    let youtubeService: YouTubeService;
    let youtubeQueue: any;

    const mockRedisService = {
        get: jest.fn(),
        set: jest.fn(),
    };

    const mockYoutubeQueue = {
        add: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                YouTubeService,
                {
                    provide: RedisService,
                    useValue: mockRedisService,
                },
                {
                    provide: getQueueToken('youtube'),
                    useValue: mockYoutubeQueue,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        youtubeService = module.get<YouTubeService>(YouTubeService);
        youtubeQueue = module.get(getQueueToken('youtube'));

        mockConfigService.get.mockImplementation((key: string) => {
            const config = {
                youtubeApiKey: 'test-api-key',
                youtubeBaseUrl: 'https://www.googleapis.com/youtube/v3',
                youtubeVideoDetailsCacheDuration: 600,
                youtubeVideoCommentsCacheDuration: 3600,
            };
            return config[key];
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getVideoDetails', () => {
        const mockVideoId = 'testVideoId';
        const mockVideoDetails = {
            title: 'Test Video',
            description: 'Test Description',
            viewCount: '1000',
            likeCount: '100',
        };

        it('should return cached video details if available', async () => {
            mockRedisService.get.mockResolvedValue(JSON.stringify(mockVideoDetails));

            const result = await youtubeService.getVideoDetails(mockVideoId);

            expect(result).toEqual(mockVideoDetails);
            expect(mockRedisService.get).toHaveBeenCalledWith(`video:${mockVideoId}`);
            expect(axios.get).not.toHaveBeenCalled();
        });

        it('should fetch and cache video details if not in cache', async () => {
            mockRedisService.get.mockResolvedValue(null);
            (axios.get as jest.Mock).mockResolvedValue({
                data: {
                    items: [
                        {
                            snippet: {
                                title: mockVideoDetails.title,
                                description: mockVideoDetails.description,
                            },
                            statistics: {
                                viewCount: mockVideoDetails.viewCount,
                                likeCount: mockVideoDetails.likeCount,
                            },
                        },
                    ],
                },
            });

            const result = await youtubeService.getVideoDetails(mockVideoId);

            expect(result).toEqual(mockVideoDetails);
            expect(mockRedisService.get).toHaveBeenCalledWith(`video:${mockVideoId}`);
            expect(axios.get).toHaveBeenCalled();
            expect(mockRedisService.set).toHaveBeenCalledWith(
                `video:${mockVideoId}`,
                JSON.stringify(mockVideoDetails),
                600
            );
        });

        it('should use correct API URL and key when fetching video details', async () => {
            mockRedisService.get.mockResolvedValue(null);
            (axios.get as jest.Mock).mockResolvedValue({
                data: {
                    items: [
                        {
                            snippet: {
                                title: mockVideoDetails.title,
                                description: mockVideoDetails.description,
                            },
                            statistics: {
                                viewCount: mockVideoDetails.viewCount,
                                likeCount: mockVideoDetails.likeCount,
                            },
                        },
                    ],
                },
            });

            await youtubeService.getVideoDetails(mockVideoId);

            expect(axios.get).toHaveBeenCalledWith(
                expect.stringContaining('https://www.googleapis.com/youtube/v3/videos')
            );
            expect(axios.get).toHaveBeenCalledWith(
                expect.stringContaining('key=test-api-key')
            );
        });

        it('should throw NotFoundException when video is not found', async () => {
            mockRedisService.get.mockResolvedValue(null);
            (axios.get as jest.Mock).mockRejectedValue({ response: { status: 404 } });

            await expect(youtubeService.getVideoDetails(mockVideoId)).rejects.toThrow(NotFoundException);
        });

        it('should throw HttpException when API quota is exceeded', async () => {
            mockRedisService.get.mockResolvedValue(null);
            (axios.get as jest.Mock).mockRejectedValue({ response: { status: 403 } });

            await expect(youtubeService.getVideoDetails(mockVideoId)).rejects.toThrow(HttpException);
        });

        it('should throw HttpException for other errors', async () => {
            mockRedisService.get.mockResolvedValue(null);
            (axios.get as jest.Mock).mockRejectedValue(new Error('Unknown error'));

            await expect(youtubeService.getVideoDetails(mockVideoId)).rejects.toThrow(HttpException);
        });
    });

    describe('getVideoComments', () => {
        const baseCommentsRequestDto: YouTubeCommentsRequestDto = {
            videoId: 'testVideoId',
            maxResults: 20,
        };

        const mockCommentsRequestDto: YouTubeCommentsRequestDto = {
            videoId: 'testVideoId',
            maxResults: 20,
            pageToken: 'testPageToken',
        };

        const mockCommentsResponse: CommentsResponseDto = {
            comments: [
                {
                    id: 'commentId1',
                    text: 'Great video!',
                    author: 'User1',
                    publishedAt: '2024-09-01T12:00:00Z',
                    likeCount: 10,
                    replyCount: 2,
                },
            ],
            nextPageToken: 'nextPageToken',
            pageInfo: {
                totalResults: 100,
                resultsPerPage: 20,
            },
        };

        it('should return cached comments if available', async () => {
            mockRedisService.get.mockResolvedValue(JSON.stringify(mockCommentsResponse));

            const result = await youtubeService.getVideoComments(mockCommentsRequestDto);

            expect(result).toEqual(mockCommentsResponse);
            expect(mockRedisService.get).toHaveBeenCalledWith(`comments:${mockCommentsRequestDto.videoId}:${mockCommentsRequestDto.pageToken}`);
            expect(axios.get).not.toHaveBeenCalled();
        });

        it('should fetch and cache comments if not in cache', async () => {
            mockRedisService.get.mockResolvedValue(null);
            (axios.get as jest.Mock).mockResolvedValue({
                data: {
                    items: [
                        {
                            id: 'commentId1',
                            snippet: {
                                topLevelComment: {
                                    snippet: {
                                        textDisplay: 'Great video!',
                                        authorDisplayName: 'User1',
                                        publishedAt: '2024-09-01T12:00:00Z',
                                        likeCount: 10,
                                    },
                                },
                                totalReplyCount: 2,
                            },
                        },
                    ],
                    nextPageToken: 'nextPageToken',
                    pageInfo: {
                        totalResults: 100,
                        resultsPerPage: 20,
                    },
                },
            });

            const result = await youtubeService.getVideoComments(mockCommentsRequestDto);

            expect(result).toEqual(mockCommentsResponse);
            expect(mockRedisService.get).toHaveBeenCalledWith(`comments:${mockCommentsRequestDto.videoId}:${mockCommentsRequestDto.pageToken}`);
            expect(axios.get).toHaveBeenCalled();
            expect(mockRedisService.set).toHaveBeenCalledWith(
                `comments:${mockCommentsRequestDto.videoId}:${mockCommentsRequestDto.pageToken}`,
                JSON.stringify(mockCommentsResponse),
                3600
            );
            expect(youtubeQueue.add).toHaveBeenCalledWith('fetchNextPage', {
                videoId: mockCommentsRequestDto.videoId,
                pageToken: 'nextPageToken',
                maxResults: mockCommentsRequestDto.maxResults,
            });
        });

        it('should use correct API URL and key when fetching comments', async () => {
            mockRedisService.get.mockResolvedValue(null);
            (axios.get as jest.Mock).mockResolvedValue({
                data: {
                    items: [],
                    pageInfo: {
                        totalResults: 0,
                        resultsPerPage: 20,
                    },
                },
            });

            await youtubeService.getVideoComments(mockCommentsRequestDto);

            expect(axios.get).toHaveBeenCalledWith(
                expect.stringContaining('https://www.googleapis.com/youtube/v3/commentThreads')
            );
            expect(axios.get).toHaveBeenCalledWith(
                expect.stringContaining('key=test-api-key')
            );
        });

        it('should handle comments with no next page', async () => {
            mockRedisService.get.mockResolvedValue(null);
            (axios.get as jest.Mock).mockResolvedValue({
                data: {
                    items: [
                        {
                            id: 'commentId1',
                            snippet: {
                                topLevelComment: {
                                    snippet: {
                                        textDisplay: 'Great video!',
                                        authorDisplayName: 'User1',
                                        publishedAt: '2024-09-01T12:00:00Z',
                                        likeCount: 10,
                                    },
                                },
                                totalReplyCount: 2,
                            },
                        },
                    ],
                    pageInfo: {
                        totalResults: 1,
                        resultsPerPage: 20,
                    },
                },
            });

            const result = await youtubeService.getVideoComments(mockCommentsRequestDto);

            expect(result.nextPageToken).toBeNull();
            expect(youtubeQueue.add).not.toHaveBeenCalled();
        });

        it('should throw NotFoundException when comments are not found', async () => {
            mockRedisService.get.mockResolvedValue(null);
            (axios.get as jest.Mock).mockRejectedValue({ response: { status: 404 } });

            await expect(youtubeService.getVideoComments(mockCommentsRequestDto)).rejects.toThrow(NotFoundException);
        });

        it('should throw HttpException when API quota is exceeded', async () => {
            mockRedisService.get.mockResolvedValue(null);
            (axios.get as jest.Mock).mockRejectedValue({ response: { status: 403 } });

            await expect(youtubeService.getVideoComments(mockCommentsRequestDto)).rejects.toThrow(HttpException);
        });

        it('should throw HttpException for other errors', async () => {
            mockRedisService.get.mockResolvedValue(null);
            (axios.get as jest.Mock).mockRejectedValue(new Error('Unknown error'));

            await expect(youtubeService.getVideoComments(mockCommentsRequestDto)).rejects.toThrow(HttpException);
        });

        it('should handle first page of comments (null pageToken)', async () => {
            const firstPageRequestDto = { ...baseCommentsRequestDto };
            mockRedisService.get.mockResolvedValue(null);
            (axios.get as jest.Mock).mockResolvedValue({
                data: {
                    items: [
                        {
                            id: 'commentId1',
                            snippet: {
                                topLevelComment: {
                                    snippet: {
                                        textDisplay: 'First comment',
                                        authorDisplayName: 'User1',
                                        publishedAt: '2024-09-01T12:00:00Z',
                                        likeCount: 10,
                                    },
                                },
                                totalReplyCount: 2,
                            },
                        },
                    ],
                    nextPageToken: 'nextPageToken',
                    pageInfo: {
                        totalResults: 100,
                        resultsPerPage: 20,
                    },
                },
            });

            const result = await youtubeService.getVideoComments(firstPageRequestDto);

            expect(result.comments[0].text).toBe('First comment');
            expect(result.nextPageToken).toBe('nextPageToken');
            expect(axios.get).toHaveBeenCalledWith(
                expect.not.stringContaining('pageToken=')
            );
            expect(axios.get).toHaveBeenCalledWith(
                expect.stringContaining('https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=testVideoId&maxResults=20&key=test-api-key')
            );
        });

        it('should handle last page of comments (no nextPageToken)', async () => {
            const lastPageRequestDto = { ...baseCommentsRequestDto, pageToken: 'lastPageToken' };
            mockRedisService.get.mockResolvedValue(null);
            (axios.get as jest.Mock).mockResolvedValue({
                data: {
                    items: [
                        {
                            id: 'commentId1',
                            snippet: {
                                topLevelComment: {
                                    snippet: {
                                        textDisplay: 'Last comment',
                                        authorDisplayName: 'User1',
                                        publishedAt: '2024-09-01T12:00:00Z',
                                        likeCount: 10,
                                    },
                                },
                                totalReplyCount: 2,
                            },
                        },
                    ],
                    pageInfo: {
                        totalResults: 100,
                        resultsPerPage: 20,
                    },
                },
            });

            const result = await youtubeService.getVideoComments(lastPageRequestDto);

            expect(result.comments[0].text).toBe('Last comment');
            expect(result.nextPageToken).toBeNull();
            expect(youtubeQueue.add).not.toHaveBeenCalled();
        });

        it('should handle empty comments response', async () => {
            mockRedisService.get.mockResolvedValue(null);
            (axios.get as jest.Mock).mockResolvedValue({
                data: {
                    items: [],
                    pageInfo: {
                        totalResults: 0,
                        resultsPerPage: 20,
                    },
                },
            });

            const result = await youtubeService.getVideoComments(baseCommentsRequestDto);

            expect(result.comments).toEqual([]);
            expect(result.nextPageToken).toBeNull();
            expect(youtubeQueue.add).not.toHaveBeenCalled();
        });

        it('should handle maximum results limit', async () => {
            const maxResultsRequestDto = { ...baseCommentsRequestDto, maxResults: 100 };
            mockRedisService.get.mockResolvedValue(null);
            (axios.get as jest.Mock).mockResolvedValue({
                data: {
                    items: Array(100).fill({
                        id: 'commentId',
                        snippet: {
                            topLevelComment: {
                                snippet: {
                                    textDisplay: 'Comment',
                                    authorDisplayName: 'User',
                                    publishedAt: '2024-09-01T12:00:00Z',
                                    likeCount: 1,
                                },
                            },
                            totalReplyCount: 0,
                        },
                    }),
                    nextPageToken: 'nextPageToken',
                    pageInfo: {
                        totalResults: 200,
                        resultsPerPage: 100,
                    },
                },
            });

            const result = await youtubeService.getVideoComments(maxResultsRequestDto);

            expect(result.comments.length).toBe(100);
            expect(axios.get).toHaveBeenCalledWith(
                expect.stringContaining('maxResults=100')
            );
        });

        it('should handle API response with missing fields', async () => {
            mockRedisService.get.mockResolvedValue(null);
            (axios.get as jest.Mock).mockResolvedValue({
                data: {
                    items: [
                        {
                            id: 'commentId1',
                            snippet: {
                                topLevelComment: {
                                    snippet: {
                                        textDisplay: 'Incomplete comment',
                                        likeCount: 5,
                                    },
                                },
                            },
                        },
                    ],
                    pageInfo: {
                        totalResults: 1,
                        resultsPerPage: 20,
                    },
                },
            });

            const result = await youtubeService.getVideoComments(baseCommentsRequestDto);

            expect(result.comments[0]).toEqual({
                id: 'commentId1',
                text: 'Incomplete comment',
                author: '',
                publishedAt: '',
                likeCount: 5,
                replyCount: 0,
            });
        });


    });
});