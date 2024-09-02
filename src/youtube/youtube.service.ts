import { HttpException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { RedisService } from '../redis/redis.service';
import { CommentDto } from './dto/comment.dto';
import { VideoDetailsDto } from './dto/video-details.dto';
import { CommentsResponseDto } from './dto/multi_comments.dto';
import { YouTubeCommentsRequestDto } from './dto/comments-request.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class YouTubeService {
    private readonly logger = new Logger(YouTubeService.name);

    constructor(
        private redisService: RedisService,
        @InjectQueue('youtube') private youtubeQueue: Queue,
        private configService: ConfigService
    ) { }

    async getVideoDetails(videoId: string): Promise<any> {
        const cacheKey = `video:${videoId}`;
        const cachedData = await this.redisService.get(cacheKey);

        if (cachedData) {
            return JSON.parse(cachedData);
        }

        try {
            const url = this.buildUrl('/videos', {
                part: 'snippet,statistics',
                id: videoId,
            });

            const response = await axios.get(url);
            const video = response.data.items[0];

            const videoDetails: VideoDetailsDto = {
                title: video.snippet.title,
                description: video.snippet.description,
                viewCount: video.statistics.viewCount,
                likeCount: video.statistics.likeCount,
            };

            await this.redisService.set(
                cacheKey,
                JSON.stringify(videoDetails),
                this.configService.get<number>('youtubeVideoDetailsCacheDuration')
            );

            return videoDetails;
        } catch (error) {
            this.handleError(error);
        }
    }

    async getVideoComments(commentsRequestDto: YouTubeCommentsRequestDto): Promise<CommentsResponseDto> {
        const cacheKey = `comments:${commentsRequestDto.videoId}:${commentsRequestDto.pageToken || 'initial'}`;
        const cachedData = await this.redisService.get(cacheKey);

        if (cachedData) {
            this.logger.log(`Returning cached data for ${cacheKey}`);
            return JSON.parse(cachedData);
        }

        try {
            const params: Record<string, string | number> = {
                part: 'snippet',
                videoId: commentsRequestDto.videoId,
                maxResults: commentsRequestDto.maxResults,
            };

            if (commentsRequestDto.pageToken) {
                params.pageToken = commentsRequestDto.pageToken;
            }

            const url = this.buildUrl('/commentThreads', params);

            const response = await axios.get(url);
            const result = this.mapCommentsResponse(response.data);

            await this.redisService.set(
                cacheKey,
                JSON.stringify(result),
                this.configService.get<number>('youtubeVideoCommentsCacheDuration')
            );

            if (result.nextPageToken) {
                await this.youtubeQueue.add('fetchNextPage', {
                    videoId: commentsRequestDto.videoId,
                    pageToken: result.nextPageToken,
                    maxResults: commentsRequestDto.maxResults,
                });
            }
            return result;
        } catch (error) {
            this.handleError(error);
        }
    }

    private buildUrl(endpoint: string, params: Record<string, string | number>): string {
        const baseUrl = this.configService.get<string>('youtubeBaseUrl');
        const apiKey = this.configService.get<string>('youtubeApiKey');
        const queryParams = new URLSearchParams({ ...params, key: apiKey });
        return `${baseUrl}${endpoint}?${queryParams.toString()}`;
    }

    private mapCommentsResponse(data: any): CommentsResponseDto {
        const mappedComments: CommentDto[] = data.items.map(item => ({
            id: item.id,
            text: item.snippet?.topLevelComment?.snippet?.textDisplay || '',
            author: item.snippet?.topLevelComment?.snippet?.authorDisplayName || '',
            publishedAt: item.snippet?.topLevelComment?.snippet?.publishedAt || '',
            likeCount: item.snippet?.topLevelComment?.snippet?.likeCount || 0,
            replyCount: item.snippet?.totalReplyCount || 0,
        }));

        return {
            comments: mappedComments,
            nextPageToken: data.nextPageToken || null,
            pageInfo: data.pageInfo || { totalResults: 0, resultsPerPage: 0 },
        };
    }

    private handleError(error: any) {
        this.logger.error(`Error fetching data: ${error.message}`);
        if (error.response?.status === 404) {
            throw new NotFoundException('Video not found');
        } else if (error.response?.status === 403) {
            throw new HttpException('API quota exceeded', 403);
        } else {
            throw new HttpException('Error fetching data', 500);
        }
    }
}

