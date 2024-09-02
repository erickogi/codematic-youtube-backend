import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { appConfig } from './app.config';

@Module({
    imports: [
        NestConfigModule.forRoot({
            load: [appConfig],
            isGlobal: true,
        }),
    ],
})
export class ConfigModule { }