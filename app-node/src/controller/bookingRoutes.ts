import { Hono } from 'hono';
import { BookingService } from '../service/BookingService';
import { UpdateBookingStatusService } from '../service/UpdateBookingStatusService';
import { BookingStatus } from '../entity/BookingStatus';
import { jwtAuthMiddleware, requireRoles } from '../middleware/auth';
import { createBookingSchema, confirmBookingSchema, rejectBookingSchema } from './dto/schemas';
import { TicketMasterException } from '../exception/TicketMasterException';

export function bookingRoutes(
  bookingService: BookingService,
  updateBookingStatusService: UpdateBookingStatusService,
): Hono {
  const app = new Hono();

  // POST /bookings – create a booking
  app.post(
    '/',
    jwtAuthMiddleware,
    requireRoles('admin', 'bookings:reserve'),
    async (c) => {
      const body = await c.req.json().catch(() => null);
      const parsed = createBookingSchema.safeParse(body);
      if (!parsed.success) {
        return c.json(
          { status: 400, title: 'Validation Error', detail: parsed.error.message },
          400,
        );
      }

      const payload = c.get('jwtPayload');
      const userId = parseInt(payload.sub, 10);

      try {
        const bookingId = await bookingService.createBooking(userId, parsed.data);
        return c.json({ bookingId });
      } catch (err) {
        if (err instanceof TicketMasterException) {
          return c.json(err.body, err.statusCode as 401 | 422 | 500);
        }
        throw err;
      }
    },
  );

  // POST /bookings/confirm
  app.post(
    '/confirm',
    jwtAuthMiddleware,
    requireRoles('admin', 'bookings:confirm'),
    async (c) => {
      const body = await c.req.json().catch(() => null);
      const parsed = confirmBookingSchema.safeParse(body);
      if (!parsed.success) {
        return c.json(
          { status: 400, title: 'Validation Error', detail: parsed.error.message },
          400,
        );
      }

      try {
        await updateBookingStatusService.updateBookingStatus(
          parsed.data.bookingId,
          BookingStatus.CONFIRMED,
        );
        return c.body(null, 204);
      } catch (err) {
        if (err instanceof TicketMasterException) {
          return c.json(err.body, err.statusCode as 401 | 422 | 500);
        }
        throw err;
      }
    },
  );

  // POST /bookings/reject
  app.post(
    '/reject',
    jwtAuthMiddleware,
    requireRoles('admin', 'bookings:reject'),
    async (c) => {
      const body = await c.req.json().catch(() => null);
      const parsed = rejectBookingSchema.safeParse(body);
      if (!parsed.success) {
        return c.json(
          { status: 400, title: 'Validation Error', detail: parsed.error.message },
          400,
        );
      }

      try {
        await updateBookingStatusService.updateBookingStatus(
          parsed.data.bookingId,
          BookingStatus.REJECTED,
        );
        return c.body(null, 204);
      } catch (err) {
        if (err instanceof TicketMasterException) {
          return c.json(err.body, err.statusCode as 401 | 422 | 500);
        }
        throw err;
      }
    },
  );

  return app;
}
