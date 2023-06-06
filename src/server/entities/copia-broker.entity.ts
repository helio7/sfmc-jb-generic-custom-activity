import { Entity, Column, PrimaryColumn } from "typeorm"

@Entity()
export class CopiaBroker {
  @Column({ name: 'BROUO_KEY_SUBPARTITION', nullable: false })
  BROUO_KEY_SUBPARTITION: string;

  @PrimaryColumn({ name: 'BROUO_ID', nullable: false })
  BROUO_ID: number;

  @Column({ name: 'BROUO_INST_ID', nullable: false })
  BROUO_INST_ID: number;

  @Column({ name: 'BROUO_CLU_BILL_NUMBER', nullable: false })
  BROUO_CLU_BILL_NUMBER: string;

  @Column({ name: 'BROUO_ACION_DATE', nullable: false })
  BROUO_ACION_DATE: Date;

  @Column({ name: 'BROUO_SYSTEM_DATE', nullable: false })
  BROUO_SYSTEM_DATE: Date;

  @Column({ name: 'BROUO_EXPIRE_DATE', nullable: true })
  BROUO_EXPIRE_DATE: Date;

  @Column({ name: 'BROUO_STATUS', nullable: true })
  BROUO_STATUS: string;

  @Column({ name: 'BROUO_SEC_ERR_CODE', nullable: true })
  BROUO_SEC_ERR_CODE: number;

  @Column({ name: 'BROUO_USR_ID', nullable: false })
  BROUO_USR_ID: string;

  @Column({ name: 'BROUO_PRIORITY', nullable: true })
  BROUO_PRIORITY: number;

  @Column({ name: 'BROUO_SUBJECT', nullable: true })
  BROUO_SUBJECT: string;

  @Column({ name: 'BROUO_MESSAGE_TEXT', nullable: true })
  BROUO_MESSAGE_TEXT: string;

  @Column({ name: 'BROUO_CALLBACK_NUMBER', nullable: true })
  BROUO_CALLBACK_NUMBER: string;
}
