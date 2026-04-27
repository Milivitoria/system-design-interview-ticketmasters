import { DataSource } from 'typeorm';
import { BookingEntity } from '../entity/BookingEntity';
import { BookingStatus } from '../entity/BookingStatus';
import { SeatEntity } from '../entity/SeatEntity';
import { SeatStatus } from '../entity/SeatStatus';
import { TicketEntity } from '../entity/TicketEntity';
import { ResourceNotFoundException } from '../exception/ResourceNotFoundException';

export class ExpireBookingService {
  constructor(private readonly dataSource: DataSource) {}

  async expireBooking(bookingId: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const bookingRepo = manager.getRepository(BookingEntity);
      const seatRepo = manager.getRepository(SeatEntity);
      const ticketRepo = manager.getRepository(TicketEntity);

      const booking = await bookingRepo.findOne({
        where: { id: bookingId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!booking) {
        throw new ResourceNotFoundException('Booking not found', 'Booking with id not found');
      }

      if (booking.status !== BookingStatus.PENDING) {
        // Already confirmed/rejected/expired – nothing to do
        return;
      }

      booking.status = BookingStatus.EXPIRED;
      await bookingRepo.save(booking);

      // Release all seats
      const tickets = await ticketRepo.find({
        where: { booking: { id: bookingId } },
        relations: ['seat'],
      });

      for (const ticket of tickets) {
        if (ticket.seat.status === SeatStatus.BOOKED) {
          ticket.seat.status = SeatStatus.AVAILABLE;
          await seatRepo.save(ticket.seat);
        }
      }
    });
  }
}
