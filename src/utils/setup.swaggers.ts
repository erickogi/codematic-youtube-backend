import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SwaggerAuthMiddleware } from 'src/middleware';

export function setupSwagger(app: INestApplication): void {
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.use('/codematic/documentation', new SwaggerAuthMiddleware().use);
  const options = new DocumentBuilder()
    .setTitle('Codematic Backend consumer document')
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('codematic/documentation', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
