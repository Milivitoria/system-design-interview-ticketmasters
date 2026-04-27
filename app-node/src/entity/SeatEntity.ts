import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EventEntity } from './EventEntity';
import { SeatStatus } from './SeatStatus';

@Entity('tb_seats')
export class SeatEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => EventEntity, (event) => event.seats, { nullable: false })
  @JoinColumn({ name: 'event_id' })
  event!: EventEntity;

  @Column()
  name!: string;

  @Column({ type: 'varchar' })
  status!: SeatStatus;
}
