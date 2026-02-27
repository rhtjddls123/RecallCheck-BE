import { BaseModel } from 'src/common/entity/base.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class SafetyInfoModel extends BaseModel {
  @Column({ unique: true })
  externalId: string;

  @Column()
  title: string;

  @Column()
  uploadDate: Date;

  @Column()
  updateDate: Date;

  @Column()
  infoUrl: string;

  @Column()
  tmnlImgUrl: string;
}
