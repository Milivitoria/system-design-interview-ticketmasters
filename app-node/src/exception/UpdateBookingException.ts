import { TicketMasterException } from './TicketMasterException';

export class UpdateBookingException extends TicketMasterException {
  constructor(title: string, detail: string) {
    super(422, {
      type: 'about:blank',
      title,
      detail,
      status: 422,
      invalidParams: null,
    });
  }
}
