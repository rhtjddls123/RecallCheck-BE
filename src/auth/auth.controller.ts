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

  private domain =
    process.env.NODE_ENV === 'production' ? '.recall-check.site' : undefined;

  // 앱용 카카오 로그인 시작 - WebView로 이 URL을 열어요
  @Get('kakao/app')
  kakaoAppLoginStart(@Res() res: Response) {
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.KAKAO_CLIENT_ID}&redirect_uri=${process.env.KAKAO_APP_REDIRECT_URI}&response_type=code`;
    res.redirect(kakaoAuthUrl);
  }

  // 카카오에서 code 받아서 토큰 발급 후 앱 딥링크로 리다이렉트
  @Get('kakao/app/callback')
  async kakaoAppCallback(@Query('code') code: string, @Res() res: Response) {
    try {
      const { accessToken, refreshToken } = await this.authService.kakaoLogin(
        code,
        'app',
      );

      // 앱 딥링크로 토큰 전달
      const deepLink = `recall-check-app://auth?accessToken=${accessToken}&refreshToken=${refreshToken}`;
      res.redirect(deepLink);
    } catch {
      // 실패 시 에러 딥링크
      res.redirect(`recall-check-app://auth?error=login_failed`);
    }
  }

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
      domain: this.domain,
      maxAge: 1000 * 60 * 60, // 1시간
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      domain: this.domain,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7일
    });

    return { success: true };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = (req.cookies['refreshToken'] ||
      (req.body as { refreshToken: string })['refreshToken']) as string;

    if (refreshToken) {
      try {
        const payload = this.authService.verifyToken(refreshToken);
        await this.authService.logout(payload.sub);
      } catch {
        // 토큰 만료돼도 쿠키는 제거
      }
    }

    res.clearCookie('accessToken', {
      domain: this.domain,
    });
    res.clearCookie('refreshToken', {
      domain: this.domain,
    });

    return { success: true };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refreshToken'] as string;

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refresh(refreshToken);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60,
      domain: this.domain,
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      domain: this.domain,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return { success: true };
  }

  @Post('refresh/app')
  async refreshApp(@Req() req: Request) {
    const refreshToken = (req.body as { refreshToken: string })['refreshToken'];

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refresh(refreshToken);

    return { success: true, accessToken, refreshToken: newRefreshToken };
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtGuard)
  @Get('me')
  async getMe(@User('sub') userId: number) {
    return await this.userService.getUserInfoById(userId);
  }

  @UseGuards(JwtGuard)
  @Delete()
  async deleteAccount(
    @User('sub') userId: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.deleteUser(userId);
    res.clearCookie('accessToken', {
      domain: this.domain,
    });
    res.clearCookie('refreshToken', {
      domain: this.domain,
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
