import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction } from 'express';

@Injectable()
export class DelayMiddleware implements NestMiddleware {
  use(_, __, next: NextFunction) {
    setTimeout(next, 2000);
  }
}
