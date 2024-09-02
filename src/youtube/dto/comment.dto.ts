import { ApiProperty } from '@nestjs/swagger';

export class CommentDto {
    @ApiProperty({ example: 'Ugyat2sse2TDI2bdIfp4AaABAg', description: 'Unique identifier for the comment' })
    id: string;
  
    @ApiProperty({ example: 'This is a great video!', description: 'Text content of the comment' })
    text: string;
  
    @ApiProperty({ example: 'Erick Kogi', description: 'Comment author' })
    author: string;
  
    @ApiProperty({ example: '2024-09-01T12:00:00Z', description: 'Date and time when the comment was published' })
    publishedAt: string;
  
    @ApiProperty({ example: 100, description: 'Number of likes for this comment' })
    likeCount: number;
  
    @ApiProperty({ example: 10, description: 'Number of replies to this comment' })
    replyCount: number;

    @ApiProperty({ example: 'http://image.png', description: 'Author Image' })
    authorProfileImageUrl?: string;

}
