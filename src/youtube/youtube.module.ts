import { Module, } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { YouTubeController } from './youtube.controller';
import { YouTubeService } from './youtube.service';
import { YouTubeProcessor } from './youtube.processor';
import { RedisModule } from 'src/redis/redis.module';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        RedisModule,
        ConfigModule,
        BullModule.registerQueue({
            name: 'youtube',
        })
    ],
    providers: [YouTubeService, YouTubeProcessor],
    controllers: [YouTubeController],
})
export class YouTubeModule { }
