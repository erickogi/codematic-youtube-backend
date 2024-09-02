import { ApiProperty } from '@nestjs/swagger';
import { CommentDto } from './comment.dto';

export class CommentsResponseDto {
  @ApiProperty({ type: [CommentDto], description: 'Array of comments' })
  comments: CommentDto[];

  @ApiProperty({ example: 'CDIQAA', description: 'Token for the next page of results' })
  nextPageToken: string | null;

  @ApiProperty({
    example: { totalResults: 1000, resultsPerPage: 20 },
    description: 'pagination information',
  })
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}