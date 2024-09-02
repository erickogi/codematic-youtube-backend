import { Injectable, NestMiddleware } from '@nestjs/common';
import { appConfig } from 'src/config';

@Injectable()
export class SwaggerAuthMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      res.set('WWW-Authenticate', 'Basic realm="Authentication required"');
      res.status(401).send('Authentication required');
      return;
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString();
    const [username, password] = credentials.split(':');

    const expectedUsername = appConfig().swagger_user;
    const expectedPassword = appConfig().swagger_password;

    if (username !== expectedUsername || password !== expectedPassword) {
      res.set('WWW-Authenticate', 'Basic realm="Authentication required"');
      res.status(401).send('Authentication required');
      return;
    }
    next();
  }
}
