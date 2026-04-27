import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { SeatEntity } from './SeatEntity';

@Entity('tb_events')
export class EventEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  description!: string;

  @OneToMany(() => SeatEntity, (seat) => seat.event)
  seats!: SeatEntity[];
}
