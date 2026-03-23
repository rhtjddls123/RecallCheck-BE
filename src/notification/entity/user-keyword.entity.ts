import { UserModel } from 'src/auth/entity/user.entity';
import { BaseModel } from 'src/common/entity/base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class UserKeywordModel extends BaseModel {
  @ManyToOne(() => UserModel, (user) => user.keywords, {
    onDelete: 'CASCADE',
  })
  user: UserModel;

  @Column()
  keyword: string;
}
