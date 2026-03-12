import { UserModel } from 'src/auth/entity/user.entity';
import { BaseModel } from 'src/common/entity/base.entity';
import { RecallMenuModel } from 'src/recall/entity/recall-menu.entity';
import { Column, Entity, ManyToOne, Unique } from 'typeorm';

@Entity()
@Unique(['user', 'menu'])
export class NotificationSettingModel extends BaseModel {
  @ManyToOne(() => UserModel, (user) => user.notificationSettings)
  user: UserModel;

  @ManyToOne(() => RecallMenuModel, (menu) => menu.notificationSettings)
  menu: RecallMenuModel;

  @Column({ default: true })
  isActive: boolean;
}
