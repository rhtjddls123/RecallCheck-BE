import { Exclude } from 'class-transformer';
import { BaseModel } from 'src/common/entity/base.entity';
import { Entity, Column, OneToMany } from 'typeorm';
import { UserLogModel } from './user-log.entity';

@Entity()
export class UserModel extends BaseModel {
  @Column({ unique: true })
  kakaoId: string;

  @Column({ nullable: false })
  nickname: string;

  @Column({ type: 'text', nullable: true })
  profileImage: string | null;

  @Exclude()
  @Column({ type: 'text', nullable: true })
  refreshToken: string | null;

  @OneToMany(() => UserLogModel, (logs) => logs.user)
  logs: UserLogModel[];
}
