import { Exclude } from 'class-transformer';
import { BaseModel } from 'src/common/entity/base.entity';
import { Entity, Column, OneToMany } from 'typeorm';
import { UserLogModel } from './user-log.entity';
import { RolesEnum } from '../const/roles.const';
import { NotificationSettingModel } from 'src/notification/entity/notification-setting.entity';
import { NotificationModel } from 'src/notification/entity/notification.entity';
import { FcmSubscriptionModel } from 'src/notification/entity/fcm-subscription.entity';

@Entity()
export class UserModel extends BaseModel {
  @Column({ unique: true })
  kakaoId: string;

  @Column({ nullable: false })
  nickname: string;

  @Column({ type: 'text', nullable: true })
  profileImage: string | null;

  @Column({
    enum: Object.values(RolesEnum),
    default: RolesEnum.USER,
  })
  role: RolesEnum;

  @Exclude()
  @Column({ type: 'text', nullable: true })
  refreshToken: string | null;

  @Exclude()
  @Column({ type: 'text', nullable: true })
  appRefreshToken: string | null;

  @Column({ type: 'text', nullable: true })
  quietStart: string | null;

  @Column({ type: 'text', nullable: true })
  quietEnd: string | null;

  @OneToMany(() => UserLogModel, (logs) => logs.user)
  logs: UserLogModel[];

  @OneToMany(() => NotificationSettingModel, (setting) => setting.user)
  notificationSettings: NotificationSettingModel[];

  @OneToMany(() => NotificationModel, (noti) => noti.user)
  notifications: NotificationModel[];

  @OneToMany(() => FcmSubscriptionModel, (fcm) => fcm.user)
  fcmSubscriptions: FcmSubscriptionModel[];
}
