import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ScopeEntity } from './ScopeEntity';

@Entity('tb_roles')
export class RoleEntity {
  @PrimaryGeneratedColumn({ name: 'role_id' })
  id!: number;

  @Column({ name: 'name', unique: true, nullable: false })
  name!: string;

  @ManyToMany(() => ScopeEntity, { eager: true })
  @JoinTable({
    name: 'tb_role_scopes',
    joinColumn: { name: 'role_id' },
    inverseJoinColumn: { name: 'scope_id' },
  })
  scopes!: ScopeEntity[];
}
