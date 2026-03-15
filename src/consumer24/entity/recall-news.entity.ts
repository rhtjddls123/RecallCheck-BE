import { BaseModel } from 'src/common/entity/base.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class RecallNewsModel extends BaseModel {
  @Column()
  title: string;

  @Column()
  thumbnailUrl: string;

  @Column({ unique: true })
  linkUrl: string;

  @Column()
  date: string;
}
