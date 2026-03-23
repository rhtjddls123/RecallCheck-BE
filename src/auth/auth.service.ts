import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { UserModel } from './entity/user.entity';
import { RolesEnum } from './const/roles.const';

interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}

interface KakaoUserResponse {
  id: number;
  kakao_account: {
    profile: {
      nickname: string;
      profile_image_url: string;
    };
  };
}

export interface JwtPayload {
  sub: number;
  nickname: string;
  type: 'refresh' | 'access';
  role: RolesEnum;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(UserModel)
    private readonly userRepository: Repository<UserModel>,
  ) {}

  async kakaoLogin(code: string, type: 'web' | 'app' = 'web') {
    if (!code) {
      throw new HttpException('code가 없습니다', HttpStatus.BAD_REQUEST);
    }

    const tokenResponse = await axios.post<KakaoTokenResponse>(
      'https://kauth.kakao.com/oauth/token',
      {
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_CLIENT_ID,
        client_secret: process.env.KAKAO_CLIENT_SECRET,
        redirect_uri:
          type === 'web'
            ? process.env.KAKAO_REDIRECT_URI
            : process.env.KAKAO_APP_REDIRECT_URI,
        code,
      },
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    const { access_token } = tokenResponse.data;

    const userResponse = await axios.get<KakaoUserResponse>(
      'https://kapi.kakao.com/v2/user/me',
      { headers: { Authorization: `Bearer ${access_token}` } },
    );

    const { id, kakao_account } = userResponse.data;

    let user = await this.userRepository.findOne({
      where: { kakaoId: String(id) },
    });

    if (!user) {
      user = await this.userRepository.save({
        kakaoId: String(id),
        nickname: kakao_account?.profile?.nickname,
        profileImage: kakao_account?.profile?.profile_image_url,
      });
    }

    const { accessToken, refreshToken } = this.loginUser(user);

    if (type === 'web') {
      await this.userRepository.update(user.id, { refreshToken });
    } else if (type === 'app') {
      await this.userRepository.update(user.id, {
        appRefreshToken: refreshToken,
      });
    }

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string, type: 'web' | 'app' = 'web') {
    let payload: JwtPayload;

    try {
      payload = this.verifyToken(refreshToken);
    } catch {
      throw new UnauthorizedException('유효하지 않은 토큰입니다');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('리프레시 토큰이 아닙니다');
    }

    const user = await this.userRepository.findOne({
      where: {
        id: payload.sub,
        ...(type === 'web'
          ? { refreshToken }
          : { appRefreshToken: refreshToken }),
      },
    });

    if (!user) {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다');
    }

    const newAccessToken = this.signToken(user, false);
    const newRefreshToken = this.signToken(user, true);

    await this.userRepository.update(user.id, {
      ...(type === 'web'
        ? { refreshToken: newRefreshToken }
        : { appRefreshToken: newRefreshToken }),
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: number, type: 'web' | 'app' = 'web') {
    await this.userRepository.update(userId, {
      ...(type === 'web' ? { refreshToken: null } : { appRefreshToken: null }),
    });
  }

  async deleteUser(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('유저가 존재하지 않습니다');
    }

    await axios.post(
      'https://kapi.kakao.com/v1/user/unlink',
      { target_id_type: 'user_id', target_id: user.kakaoId },
      {
        headers: {
          Authorization: `KakaoAK ${process.env.KAKAO_ADMIN_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    await this.userRepository.delete(userId);
  }

  signToken(
    user: Pick<UserModel, 'id' | 'nickname' | 'role'>,
    isRefreshToken: boolean,
  ) {
    const payload = {
      nickname: user.nickname,
      sub: user.id,
      role: user.role,
      type: isRefreshToken ? 'refresh' : 'access',
    };

    return this.jwtService.sign(payload, {
      expiresIn: isRefreshToken ? '7d' : '1h',
    });
  }

  loginUser(user: Pick<UserModel, 'id' | 'nickname' | 'role'>) {
    return {
      accessToken: this.signToken(user, false),
      refreshToken: this.signToken(user, true),
    };
  }

  verifyToken(token: string) {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('유효하지 않거나 만료된 토큰입니다.');
    }
  }
}
