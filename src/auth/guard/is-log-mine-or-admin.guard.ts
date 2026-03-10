import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user.service';
import { Request } from 'express';
import { JwtPayload } from '../auth.service';
import { RolesEnum } from '../const/roles.const';

@Injectable()
export class IsLogMineOrAdminGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { user: JwtPayload }>();
    const { user } = req;

    if (!user) {
      throw new UnauthorizedException('사용자 정보를 불러올 수 없습니다.');
    }

    if (user.role === RolesEnum.ADMIN) {
      return true;
    }

    const logId = req.params.logId as string;

    if (!logId) {
      throw new BadRequestException('Log ID가 파라미터로 제공 돼야합니다.');
    }

    const isOk = await this.userService.isLogMine(user.sub, parseInt(logId));

    if (!isOk) {
      throw new ForbiddenException('권한이 없습니다.');
    }

    return true;
  }
}
