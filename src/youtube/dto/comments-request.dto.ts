import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class YouTubeCommentsRequestDto {
    @ApiProperty({ description: 'YouTube video ID', example: 'dQw4w9WgXcQ' })
    @IsString()
    videoId: string;

    @ApiProperty({ description: 'Maximum number of results to return', example: 20, minimum: 1, maximum: 100 })
    @IsNumber()
    @Min(1)
    @Max(100)
    @IsOptional()
    maxResults?: number;

    @ApiProperty({ description: 'Token for the page of results, Null for initial page', required: false })
    @IsString()
    @IsOptional()
    pageToken?: string;
}