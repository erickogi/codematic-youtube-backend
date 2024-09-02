# Codematic YouTube Backend

This project is a backend service for fetching and caching YouTube video details and comments. It's built with NestJS and uses Redis for caching.

## API Documentation

The Swagger documentation for this API is available at:

URL: http://164.90.185.174:3009/codematic/documentation#/

To access the documentation, use the following credentials:
- Username: codematic
- Password: codematic123!

## Frontend Client

The frontend client that uses this service can be accessed at:

URL: http://164.90.185.174:3010/

## Server Setup and Deployment

### Environment Setup

1. Create a `.env` file in the root directory of the project with the following structure:

```
NODE_ENV=testing
PORT=3009
YOUTUBE_API_KEY=your_youtube_api_key
YOUTUBE_VIDEO_DETAILS_URL=/videos?part=snippet,statistics&id=VIDEO_ID&key=API_KEY
YOUTUBE_VIDEO_COMMENTS_URL=/commentThreads?part=snippet&videoId=VIDEO_ID&key=API_KEY
YOUTUBE_BASE_URL=https://www.googleapis.com/youtube/v3
REDIS_HOST=your_redis_host
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
SWAGGER_USER=your_swagger_username
SWAGGER_PASSWORD=your_swagger_password
VIDEO_DETAILS_CACHE_EXPIRY_TIME=600
VIDEO_COMMENTS_CACHE_EXPIRY_TIME=3600
RATE_LIMIT_WINDOW_SEC=3600
RATE_LIMIT_MAX=100
```

Replace the placeholder values with your actual configuration.

### GitHub Workflow

The project uses GitHub Actions for CI/CD. The workflow is defined in `.github/workflows/main.yml`. It includes steps for testing and deploying the application.

To set up the workflow:

1. Go to your GitHub repository settings.
2. Navigate to "Secrets and variables" > "Actions".
3. Add the following secrets:
   - `SERVER_IP`: Your server's IP address
   - `SERVER_USERNAME`: SSH username for your server
   - `SERVER_PASSWORD`: SSH password for your server
   - All the environment variables from your `.env` file (e.g., `NODE_ENV`, `PORT`, `YOUTUBE_API_KEY`, etc.)

### Docker and Docker Compose

The project includes a `Dockerfile` and a `docker-compose.yml` file for containerization.

To build and run the Docker container:

```bash
docker build -t codematic-youtube-backend .
docker run -p 3009:3009 --env-file .env codematic-youtube-backend
```

To run with Docker Compose:

```bash
docker-compose up -d
```

## Local Development

To run the project locally without Docker:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run start:dev
   ```

The application will be available at `http://localhost:3009`.

## Testing

The project includes a test suite. To run the tests:

```bash
npm run test
```

To run tests with coverage:

```bash
npm run test:cov
```

The test coverage results will be available in the `coverage` directory after running `npm run test:cov`.

## Rate Limiting

The application implements rate limiting to prevent abuse. The rate limit is configured in the `.env` file:

- `RATE_LIMIT_WINDOW_SEC`: The time window in seconds
- `RATE_LIMIT_MAX`: The maximum number of requests allowed within the time window

The rate limiting is implemented using a guard (`RateLimitGuard`) that checks the request rate for each IP address.

## Additional Information

- The project uses NestJS as its framework.
- Redis is used for caching to improve performance and reduce load on the YouTube API.
- The application is configured to run on port 3009 by default, but this can be changed in the `.env` file.
- Make sure to keep your YouTube API key and other sensitive information secure and never commit them to version control.

For any additional help or information, please refer to the official [NestJS documentation](https://docs.nestjs.com/).