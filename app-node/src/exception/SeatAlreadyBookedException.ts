import { TicketMasterException } from './TicketMasterException';

export class SeatAlreadyBookedException extends TicketMasterException {
  constructor(seatName: string) {
    super(422, {
      type: 'about:blank',
      title: 'Seat already booked',
      detail: `This seat ${seatName} is already booked`,
      status: 422,
      invalidParams: null,
    });
  }
}
