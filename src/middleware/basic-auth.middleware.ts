import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { appConfig } from 'src/config';

@Injectable()
export class BasicAuthMiddleware implements NestMiddleware {
  private readonly username = appConfig().swagger_user;
  private readonly password = appConfig().swagger_password;
  private readonly encodedCreds = Buffer.from(this.username + ':' + this.password).toString('base64');

  use(req: Request, res: Response, next: NextFunction) {
    const reqCreds = req.get('authorization')?.split('Basic ')?.[1] ?? null;

    if (!reqCreds || reqCreds !== this.encodedCreds) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Your realm", charset="UTF-8"');
      res.sendStatus(401);
    } else {
      next();
    }
  }
}
