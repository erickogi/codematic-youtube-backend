import { ApiProperty } from '@nestjs/swagger';

export class ThumbnailDto {
  @ApiProperty({ example: 'https://i.ytimg.com/vi/videoId/default.jpg', description: 'URL of the thumbnail' })
  url: string;

  @ApiProperty({ example: 120, description: 'Width of the thumbnail' })
  width: number;

  @ApiProperty({ example: 90, description: 'Height of the thumbnail' })
  height: number;
}
export class VideoDetailsDto {
  @ApiProperty({ example: 'Video Title', description: 'The title of the video' })
  title: string;

  @ApiProperty({ example: 'Video description', description: 'Description of the video' })
  description: string;

  @ApiProperty({ example: 1000000, description: 'Number of views for the video' })
  viewCount: number;

  @ApiProperty({ example: 10000, description: 'Number of likes for the video' })
  likeCount: number;

  @ApiProperty({ example: 'Channel Name', description: 'The title of the channel' })
  channelTitle: string;

  @ApiProperty({ type: ThumbnailDto, description: 'Thumbnails of the video' })
  thumbnails: {
    default?: ThumbnailDto;
    medium?: ThumbnailDto;
    high?: ThumbnailDto;
    standard?: ThumbnailDto;
    maxres?: ThumbnailDto;
  };

  @ApiProperty({ example: '2024-09-02T03:02:43Z', description: 'The date and time when the video was published' })
  publishedAt: string;
}