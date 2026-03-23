import { UserModel } from 'src/auth/entity/user.entity';
import { BaseModel } from 'src/common/entity/base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class FcmSubscriptionModel extends BaseModel {
  @ManyToOne(() => UserModel, (user) => user.fcmSubscriptions, {
    onDelete: 'CASCADE',
  })
  user: UserModel;

  @Column({ unique: true })
  fcmToken: string;

  @Column({ default: 'web' })
  platform: 'web' | 'app';
}
