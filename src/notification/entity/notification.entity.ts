import { UserModel } from 'src/auth/entity/user.entity';
import { BaseModel } from 'src/common/entity/base.entity';
import { RecallModel } from 'src/recall/entity/recall.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class NotificationModel extends BaseModel {
  @ManyToOne(() => UserModel, (users) => users.notifications, {
    onDelete: 'CASCADE',
  })
  user: UserModel;

  @Column()
  title: string;

  @Column()
  body: string;

  @ManyToOne(() => RecallModel, (recalls) => recalls.notifications, {
    onDelete: 'SET NULL',
  })
  recall: RecallModel;

  @Column({ default: false })
  isRead: boolean;
}
