import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SeatEntity } from './SeatEntity';
import { BookingEntity } from './BookingEntity';

@Entity('tb_tickets')
export class TicketEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid' })
  externalId!: string;

  @ManyToOne(() => SeatEntity, { nullable: false, eager: true })
  @JoinColumn({ name: 'seat_id' })
  seat!: SeatEntity;

  @ManyToOne(() => BookingEntity, { nullable: false })
  @JoinColumn({ name: 'booking_id' })
  booking!: BookingEntity;
}
