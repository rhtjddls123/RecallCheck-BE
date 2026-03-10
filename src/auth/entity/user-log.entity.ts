import { Exclude } from 'class-transformer';
import { BaseModel } from 'src/common/entity/base.entity';
import { Entity, Column, ManyToOne } from 'typeorm';
import { LogTypeEnum } from '../const/log-type.const';
import { UserModel } from './user.entity';

@Entity()
export class UserLogModel extends BaseModel {
  @Column({ type: 'enum', enum: LogTypeEnum })
  type: LogTypeEnum;

  @Column({ nullable: true })
  keyword: string;

  @Column({ nullable: true })
  contentId: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  targetUrl: string;

  @ManyToOne(() => UserModel, (user) => user.logs, { onDelete: 'CASCADE' })
  user: UserModel;
}
