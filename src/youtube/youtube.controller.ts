import { BadRequestException, Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { YouTubeService } from './youtube.service';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { VideoDetailsDto } from './dto/video-details.dto';
import { YouTubeCommentsRequestDto } from './dto/comments-request.dto';
import { RateLimitGuard } from '../guards/rate-limit.guard';
import { CommentsResponseDto } from './dto/multi_comments.dto';

@Controller('youtube')
@UseGuards(RateLimitGuard)
export class YouTubeController {
    constructor(private youtubeService: YouTubeService
    ) { }

    @Get('video/:id')
    @ApiOperation({ summary: 'Get video details' })
    @ApiParam({ name: 'id', description: 'YouTube video ID' })
    @ApiResponse({ status: 200, description: 'Video details retrieved successfully', type: VideoDetailsDto })
    async getVideoDetails(@Param('id') id: string) {
        return this.youtubeService.getVideoDetails(id);
    }

    @Get('comments')
    @ApiOperation({ summary: 'Get video comments' })
    @ApiResponse({ status: 200, description: 'Comments retrieved successfully', type: CommentsResponseDto })
    async getVideoComments(@Query() queryParams: YouTubeCommentsRequestDto) {
        if (!queryParams.videoId) {
            throw new BadRequestException('videoId is required');
        }
        if (queryParams.maxResults && (queryParams.maxResults < 1 || queryParams.maxResults > 100)) {
            throw new BadRequestException('Invalid maxResults value');
        }
        const maxResults = queryParams.maxResults || 20;
        return this.youtubeService.getVideoComments({ ...queryParams, maxResults });
    }

}