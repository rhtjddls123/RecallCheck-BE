import {
  createParamDecorator,
  ExecutionContext,
  Request,
} from '@nestjs/common';
import { JwtPayload } from '../auth.service';

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number | undefined => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: JwtPayload }>();
    if (!request['user']) return undefined;
    return request['user']['sub'];
  },
);
