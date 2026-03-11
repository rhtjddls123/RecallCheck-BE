import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class OptionalJwtGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies['accessToken'] as string;

    if (!token) {
      return true;
    }

    try {
      const payload = this.authService.verifyToken(token);

      if (payload.type !== 'access') {
        throw new UnauthorizedException('액세스 토큰이 아닙니다');
      }

      request['user'] = payload;

      return true;
    } catch {
      throw new UnauthorizedException('유효하지 않은 토큰입니다');
    }
  }
}
