import { Entity, Column, PrimaryColumn } from "typeorm"

@Entity()
export class Pack {
  @PrimaryColumn({ name: 'PACK_ID', nullable: false, type: 'varchar2', length: 6 })
  PACK_ID: string;

  @Column({ name: 'PRECIO_FINAL', nullable: false, type: 'number' })
  PRECIO_FINAL: number;

  @Column({ name: 'VIGENCIA', nullable: false, type: 'number' })
  VIGENCIA: number;

  @Column({ name: 'CAPACIDAD_PACK', nullable: false, type: 'number' })
  CAPACIDAD_PACK: string;

  @Column({ name: 'UNIDAD_PACK', nullable: false, type: 'varchar2', length: 2 })
  UNIDAD_PACK: string;

  @Column({ name: 'CAPACIDAD_UNIDAD_PACK', nullable: false, type: 'varchar2', length: 42 })
  CAPACIDAD_UNIDAD_PACK: string;

  @Column({ name: 'DESCRIPCION_PACK', nullable: true, type: 'varchar2', length: 100 })
  DESCRIPCION_PACK: string;

  @Column({ name: 'DESCUENTO', nullable: true, type: 'number' })
  DESCUENTO: number;
}
