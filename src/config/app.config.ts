import * as process from 'process';
import * as dotenv from 'dotenv';
dotenv.config();
export const appConfig = () => ({
  environment: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3009,
  swagger_user: process.env.SWAGGER_USER || 'admin',
  swagger_password: process.env.SWAGGER_PASSWORD || 'test',
  redisHost: process.env.REDIS_HOST,
  redisPort: parseInt(process.env.REDIS_PORT),
  youtubeApiKey: process.env.YOUTUBE_API_KEY,
  youtubeBaseUrl: process.env.YOUTUBE_BASE_URL,
  youtudeVideoDetailsUrl: process.env.YOUTUBE_VIDEO_DETAILS_URL,
  youtudeVideoCommentsUrl: process.env.YOUTUBE_VIDEO_COMMENTS_URL,
  youtubeVideoDetailsCacheDuration: parseInt(process.env.YOUTUBE_VIDEO_DETAILS_CACHE_DURATION, 10) || 3600,
  youtubeVideoCommentsCacheDuration: parseInt(process.env.YOUTUBE_VIDEO_COMMENTS_CACHE_DURATION, 10) || 3600,
  ratelimitWindow: parseInt(process.env.RATELIMIT_WINDOW, 10) || 3600,
  ratelimitMax: parseInt(process.env.RATELIMIT_MAX, 10) || 1000,
});
