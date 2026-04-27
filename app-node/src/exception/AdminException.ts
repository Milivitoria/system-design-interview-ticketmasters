import { TicketMasterException } from './TicketMasterException';

export class AdminException extends TicketMasterException {
  constructor() {
    super(422, {
      type: 'about:blank',
      title: 'Admin creation exception',
      detail: 'Admin user can only be created when there are no users in the system.',
      status: 422,
      invalidParams: null,
    });
  }
}
