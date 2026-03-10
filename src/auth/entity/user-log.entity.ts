import { Exclude } from 'class-transformer';
import { BaseModel } from 'src/common/entity/base.entity';
import { Entity, Column, ManyToOne } from 'typeorm';
import { LogTypeEnum } from '../const/log-type.const';
import { UserModel } from './user.entity';

@Entity()
export class UserLogModel extends BaseModel {
  @Column({ type: 'enum', enum: LogTypeEnum })
  type: LogTypeEnum;

  @Column({ type: 'text', nullable: true })
  keyword: string | null;

  @Column({ type: 'text', nullable: true })
  productNm: string | null;

  @Column({ type: 'text', nullable: true })
  makr: string | null;

  @Column({ type: 'text', nullable: true })
  imageUrl: string | null;

  @Column({ type: 'text', nullable: true })
  targetUrl: string | null;

  @ManyToOne(() => UserModel, (user) => user.logs, { onDelete: 'CASCADE' })
  user: UserModel;
}
