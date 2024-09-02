import { ApiProperty } from '@nestjs/swagger';

export class VideoDetailsDto {
  @ApiProperty({ example: 'Video Title', description: 'The title of the video' })
  title: string;

  @ApiProperty({ example: 'Video description', description: 'Description of the video' })
  description: string;

  @ApiProperty({ example: 1000000, description: 'Number of views for the video' })
  viewCount: number;

  @ApiProperty({ example: 10000, description: 'Number of likes for the video' })
  likeCount: number;
}