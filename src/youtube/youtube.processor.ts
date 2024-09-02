import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { YouTubeService } from './youtube.service';
import { YouTubeCommentsRequestDto } from './dto/comments-request.dto';

@Processor('youtube')
export class YouTubeProcessor {
  private readonly logger = new Logger(YouTubeProcessor.name);
  constructor(private youtubeService: YouTubeService) {}

  @Process('fetchNextPage')
  async handleFetchNextPage(job: Job) {
    this.logger.debug('Start fetching next page');
    const { videoId, pageToken, maxResults } = job.data;
    
    if (!videoId || typeof videoId !== 'string') {
      throw new Error('VideoId is invalid or missing');
    }
    if(maxResults < 1 || maxResults > 100) {
        throw new Error('Invalid maxResults value');
    }

    const commentsRequestDto: YouTubeCommentsRequestDto = {
        videoId,
        maxResults,
        pageToken,
    };
    await this.youtubeService.getVideoComments(commentsRequestDto);
    this.logger.debug('Finished fetching next page');
  }
}