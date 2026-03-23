import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationSettingModel } from './entity/notification-setting.entity';
import { NotificationModel } from './entity/notification.entity';
import { FcmSubscriptionModel } from './entity/fcm-subscription.entity';
import { AuthModule } from 'src/auth/auth.module';
import { RecallMenuModel } from 'src/recall/entity/recall-menu.entity';
import { RecallModule } from 'src/recall/recall.module';
import { NotificationSseService } from './notification-sse.service';
import { UserModel } from 'src/auth/entity/user.entity';
import { UserKeywordModel } from './entity/user-keyword.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationSettingModel,
      NotificationModel,
      FcmSubscriptionModel,
      RecallMenuModel,
      UserModel,
      UserKeywordModel,
    ]),
    AuthModule,
    RecallModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationSseService],
  exports: [NotificationService, NotificationSseService],
})
export class NotificationModule {}
