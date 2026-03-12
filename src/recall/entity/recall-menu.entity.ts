import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { RecallModel } from './recall.entity';
import { NotificationSettingModel } from 'src/notification/entity/notification-setting.entity';

@Entity()
export class RecallMenuModel {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @OneToMany(() => RecallModel, (recall) => recall.menu)
  recalls: RecallModel[];

  @OneToMany(() => NotificationSettingModel, (setting) => setting.menu)
  notificationSettings: NotificationSettingModel[];
}
