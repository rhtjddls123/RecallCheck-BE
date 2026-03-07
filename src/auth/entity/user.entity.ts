import { BaseModel } from 'src/common/entity/base.entity';
import { Entity, Column } from 'typeorm';

@Entity()
export class UserModel extends BaseModel {
  @Column({ unique: true })
  kakaoId: string;

  @Column({ nullable: false })
  nickname: string;

  @Column({ type: 'text', nullable: true })
  profileImage: string | null;

  @Column({ type: 'text', nullable: true })
  refreshToken: string | null;
}
