import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { RecallModel } from './recall.entity';

@Entity()
export class RecallMenuModel {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @OneToMany(() => RecallModel, (recall) => recall.menu)
  recalls: RecallModel[];
}
