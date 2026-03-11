import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  UseGuards,
  Get,
  UseInterceptors,
  ClassSerializerInterceptor,
  Delete,
  Query,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtGuard } from './guard/jwt.guard';
import { UserService } from './user.service';
import { User } from './decorator/user.decorator';
import { ActivityPaginateDto } from './dto/activity-paginate.dto';
import { IsLogMineOrAdminGuard } from './guard/is-log-mine-or-admin.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('kakao')
  async kakaoLogin(
    @Body('code') code: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } =
      await this.authService.kakaoLogin(code);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      domain:
        process.env.NODE_ENV === 'production'
          ? '.recall-check.site'
          : undefined,
      maxAge: 1000 * 60 * 60, // 1시간
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      domain:
        process.env.NODE_ENV === 'production'
          ? '.recall-check.site'
          : undefined,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7일
    });

    return { success: true };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refreshToken'] as string;

    if (refreshToken) {
      try {
        const payload = this.authService.verifyToken(refreshToken);
        await this.authService.logout(payload.sub);
      } catch {
        // 토큰 만료돼도 쿠키는 제거
      }
    }

    res.clearCookie('accessToken', {
      domain:
        process.env.NODE_ENV === 'production'
          ? '.recall-check.site'
          : undefined,
    });
    res.clearCookie('refreshToken', {
      domain:
        process.env.NODE_ENV === 'production'
          ? '.recall-check.site'
          : undefined,
    });

    return { success: true };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refreshToken'] as string;

    const { accessToken } = await this.authService.refresh(refreshToken);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60,
      domain:
        process.env.NODE_ENV === 'production'
          ? '.recall-check.site'
          : undefined,
    });

    return { success: true };
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtGuard)
  @Get('me')
  async getMe(@User('sub') userId: number) {
    return await this.userService.getUserById(userId);
  }

  @UseGuards(JwtGuard)
  @Delete()
  async deleteAccount(
    @User('sub') userId: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.deleteUser(userId);
    res.clearCookie('accessToken', {
      domain:
        process.env.NODE_ENV === 'production'
          ? '.recall-check.site'
          : undefined,
    });
    res.clearCookie('refreshToken', {
      domain:
        process.env.NODE_ENV === 'production'
          ? '.recall-check.site'
          : undefined,
    });
    return { success: true };
  }

  @UseGuards(JwtGuard)
  @Get('activity')
  async getActivity(
    @Query() body: ActivityPaginateDto,
    @User('sub') userId: number,
  ) {
    return await this.userService.cursorPaginateActivity(body, userId);
  }

  @UseGuards(JwtGuard, IsLogMineOrAdminGuard)
  @Delete('activity/:logId')
  async deleteActivity(@Param('logId', ParseIntPipe) logId: number) {
    return await this.userService.deleteUserLog(logId);
  }
}
