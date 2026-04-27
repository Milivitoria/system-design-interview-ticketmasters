export interface ExceptionResponse {
  type: string;
  title: string;
  detail: string;
  status: number;
  invalidParams: unknown[] | null;
}

export class TicketMasterException extends Error {
  readonly statusCode: number;
  readonly body: ExceptionResponse;

  constructor(statusCode: number, body: ExceptionResponse) {
    super(body.title);
    this.statusCode = statusCode;
    this.body = body;
  }
}
