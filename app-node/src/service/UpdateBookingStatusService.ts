import { DataSource } from 'typeorm';
import { BookingEntity } from '../entity/BookingEntity';
import { BookingStatus } from '../entity/BookingStatus';
import { ResourceNotFoundException } from '../exception/ResourceNotFoundException';
import { UpdateBookingException } from '../exception/UpdateBookingException';

export class UpdateBookingStatusService {
  constructor(private readonly dataSource: DataSource) {}

  async updateBookingStatus(bookingId: number, status: BookingStatus): Promise<void> {
    const bookingRepo = this.dataSource.getRepository(BookingEntity);

    const booking = await bookingRepo.findOneBy({ id: bookingId });
    if (!booking) {
      throw new ResourceNotFoundException('Booking not found', 'Booking with id not found');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new UpdateBookingException(
        'Booking status cannot be updated',
        `Booking with id ${bookingId} is not in PENDING status`,
      );
    }

    booking.status = status;
    await bookingRepo.save(booking);
  }
}
