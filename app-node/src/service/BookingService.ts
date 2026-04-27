import { DataSource } from 'typeorm';
import { BookingEntity } from '../entity/BookingEntity';
import { BookingStatus } from '../entity/BookingStatus';
import { SeatEntity } from '../entity/SeatEntity';
import { SeatStatus } from '../entity/SeatStatus';
import { TicketEntity } from '../entity/TicketEntity';
import { UserEntity } from '../entity/UserEntity';
import { EventEntity } from '../entity/EventEntity';
import { ResourceNotFoundException } from '../exception/ResourceNotFoundException';
import { SeatAlreadyBookedException } from '../exception/SeatAlreadyBookedException';
import { BookingExpirationService } from './BookingExpirationService';
import { randomUUID } from 'crypto';

export interface CreateBookingDto {
  eventId: number;
  seats: Array<{ seatId: number }>;
}

export class BookingService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly bookingExpirationService: BookingExpirationService,
  ) {}

  async createBooking(userId: number, dto: CreateBookingDto): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(UserEntity);
      const eventRepo = manager.getRepository(EventEntity);
      const seatRepo = manager.getRepository(SeatEntity);
      const bookingRepo = manager.getRepository(BookingEntity);
      const ticketRepo = manager.getRepository(TicketEntity);

      const user = await userRepo.findOneBy({ id: userId });
      if (!user) {
        throw new ResourceNotFoundException('User not found', 'User with id not found');
      }

      const event = await eventRepo.findOneBy({ id: dto.eventId });
      if (!event) {
        throw new ResourceNotFoundException('Event not found', 'Event with id not found');
      }

      // Acquire pessimistic write locks on all requested seats
      const seats: SeatEntity[] = [];
      for (const reserveDto of dto.seats) {
        const seat = await seatRepo.findOne({
          where: { id: reserveDto.seatId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!seat) {
          throw new ResourceNotFoundException('Seat not found', 'Seat with id not found');
        }
        if (seat.status === SeatStatus.BOOKED) {
          throw new SeatAlreadyBookedException(seat.name);
        }
        seats.push(seat);
      }

      // Create the booking
      const booking = bookingRepo.create({
        user,
        status: BookingStatus.PENDING,
        bookedAt: new Date(),
      });
      await bookingRepo.save(booking);

      // Create tickets and mark seats as BOOKED
      for (const seat of seats) {
        const ticket = ticketRepo.create({
          externalId: randomUUID(),
          seat,
          booking,
        });
        await ticketRepo.save(ticket);

        seat.status = SeatStatus.BOOKED;
        await seatRepo.save(seat);
      }

      // Schedule expiration check (outside the transaction is fine – best effort)
      await this.bookingExpirationService.scheduleExpirationCheck(booking.id);

      return booking.id;
    });
  }
}
