import { TicketMasterException } from './TicketMasterException';

export class LoginException extends TicketMasterException {
  constructor(title: string, detail: string) {
    super(401, {
      type: 'about:blank',
      title,
      detail,
      status: 401,
      invalidParams: null,
    });
  }
}
