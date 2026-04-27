import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ScopeEntity } from './ScopeEntity';

@Entity('tb_apps')
export class AppEntity {
  @PrimaryGeneratedColumn({ name: 'app_id' })
  id!: number;

  @Column({ name: 'name', unique: true, nullable: false })
  name!: string;

  @Column({ unique: true, nullable: false, type: 'uuid' })
  clientId!: string;

  @Column({ nullable: false })
  clientSecret!: string;

  @ManyToMany(() => ScopeEntity, { eager: true })
  @JoinTable({
    name: 'tb_apps_scopes',
    joinColumn: { name: 'app_id' },
    inverseJoinColumn: { name: 'scope_id' },
  })
  scopes!: ScopeEntity[];
}
