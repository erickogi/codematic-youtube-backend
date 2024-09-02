declare const module: any;
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './utils';
import { ConfigService } from '@nestjs/config';

require('dotenv').config();
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('port');
  app.enableShutdownHooks();
  app.setGlobalPrefix('codematic');
  app.useGlobalPipes(new ValidationPipe({
    forbidNonWhitelisted: true, whitelist: true, transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));
  setupSwagger(app);
  app.getHttpServer().setTimeout(240000);
  app.enableCors();
  await app.listen(port);
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
