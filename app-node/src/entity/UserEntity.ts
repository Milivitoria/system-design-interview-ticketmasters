import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RoleEntity } from './RoleEntity';

@Entity('tb_users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @ManyToOne(() => RoleEntity, { eager: true, nullable: false })
  @JoinColumn({ name: 'role_id' })
  role!: RoleEntity;
}
