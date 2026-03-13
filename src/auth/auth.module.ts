import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModel } from './entity/user.entity';
import { UserService } from './user.service';
import { UserLogModel } from './entity/user-log.entity';
import { NotificationModel } from 'src/notification/entity/notification.entity';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: '7d' },
      }),
    }),
    TypeOrmModule.forFeature([UserModel, UserLogModel, NotificationModel]),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserService],
  exports: [AuthService, UserService],
})
export class AuthModule {}
