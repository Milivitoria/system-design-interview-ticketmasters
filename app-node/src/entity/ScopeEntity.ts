import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tb_scopes')
export class ScopeEntity {
  @PrimaryGeneratedColumn({ name: 'scope_id' })
  id!: number;

  @Column({ name: 'name', unique: true, nullable: false })
  name!: string;
}
