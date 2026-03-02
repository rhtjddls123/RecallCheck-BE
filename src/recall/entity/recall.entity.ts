import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RecallMenuModel } from './recall-menu.entity';

@Entity()
export class RecallModel {
  @PrimaryColumn({ type: 'text' })
  recallSn: string; // 리콜번호 (PK)

  @Index()
  @Column({ type: 'text' })
  cntntsId: string; // 메뉴 ID

  @Index()
  @Column({ type: 'text', nullable: false })
  productNm: string; // 제품명

  @Column({ type: 'text', nullable: true })
  makr: string | null; // 제조사

  @Index()
  @Column({ type: 'text', nullable: true })
  bsnmNm: string | null; // 사업자명

  @Column({ type: 'text', nullable: true })
  modlNmInfo: string | null; // 모델명 정보

  @Column({ type: 'text', nullable: true })
  stdBrcd: string | null; // 표준 바코드

  @Column({ type: 'text', nullable: true })
  mnfcturPd: string | null; // 제조기간

  @Column({ type: 'text', nullable: true })
  mnfcturNoInfo: string | null; // 제조번호 정보

  @Column({ type: 'text', nullable: true })
  distbTmlmtDe: string | null; // 유통기한

  @Column({ type: 'text', nullable: true })
  prmisnNo: string | null; // 허가번호

  @Column({ type: 'text', nullable: true })
  aditfield13: string | null; // 제품 상세내용

  @Column({ type: 'text', nullable: true })
  shrtcomCn: string | null; // 결함 내용

  @Column({ type: 'text', nullable: true })
  recallSe: string | null; // 리콜 구분

  @Column({ type: 'date', nullable: true })
  recallPublictBgnde: string | null; // 리콜 공표 시작일

  @Column({ type: 'date', nullable: true })
  recallPublictEndde: string | null; // 리콜 공표 만료일

  @Column({ type: 'text', nullable: true })
  injryCauseResult: string | null; // 위해 원인

  @Column({ type: 'text', nullable: true })
  hrmflGrad: string | null; // 위해성 등급

  @Column({ type: 'text', nullable: true })
  acdntCn: string | null; // 사고 내용

  @Column({ type: 'text', nullable: true })
  cnsmrGhvrTips: string | null; // 소비자 행동 요령

  @Column({ type: 'text', nullable: true })
  trtmntAtpn: string | null; // 취급 주의사항

  @Column({ type: 'date', nullable: true })
  recallBgnde: string | null; // 리콜 시작일

  @Column({ type: 'date', nullable: true })
  recallEndde: string | null; // 리콜 종료일

  @Column({ type: 'text', nullable: true })
  recallProcssInfo: string | null; // 리콜 절차

  @Column({ type: 'text', nullable: true })
  recallEntrpsInfo: string | null; // 문의처

  @Column({ type: 'text', nullable: true })
  infoOriginInstt: string | null; // 정보 출처 기관

  @Column({ type: 'text', nullable: true })
  infoOriginUrl: string | null; // 정보 출처 URL

  @Column({ type: 'text', nullable: true })
  infoCreatInstt: string | null; // 정보 생성 기관

  @Column({ type: 'simple-array', nullable: true })
  infoCreatUrl: string[] | null; // 정보 생성 URL (||로 구분)

  // 쉼표 구분 문자열을 배열처럼 저장
  @Column({ type: 'simple-array', nullable: true })
  recallImgUrls: string[] | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => RecallMenuModel, (menu) => menu.recalls)
  @JoinColumn({ name: 'cntntsId' })
  menu: RecallMenuModel;
}
