import { Hono } from 'hono';
import { EventService } from '../service/EventService';
import { jwtAuthMiddleware, requireRoles } from '../middleware/auth';
import { createEventSchema } from './dto/schemas';
import { TicketMasterException } from '../exception/TicketMasterException';

export function eventRoutes(eventService: EventService): Hono {
  const app = new Hono();

  // GET /events – public (authenticated)
  app.get('/', jwtAuthMiddleware, async (c) => {
    const page = parseInt(c.req.query('page') ?? '0', 10);
    const pageSize = parseInt(c.req.query('pageSize') ?? '10', 10);
    const result = await eventService.findAll(page, pageSize);
    return c.json(result);
  });

  // POST /events – admin or events:create
  app.post(
    '/',
    jwtAuthMiddleware,
    requireRoles('admin', 'events:create'),
    async (c) => {
      const body = await c.req.json().catch(() => null);
      const parsed = createEventSchema.safeParse(body);
      if (!parsed.success) {
        return c.json(
          { status: 400, title: 'Validation Error', detail: parsed.error.message },
          400,
        );
      }

      try {
        const event = await eventService.createEvent(parsed.data);
        c.header('Location', `/events/${event.id}`);
        return c.json(event, 201);
      } catch (err) {
        if (err instanceof TicketMasterException) {
          return c.json(err.body, err.statusCode as 401 | 422 | 500);
        }
        throw err;
      }
    },
  );

  // GET /events/:id – admin or events:read
  app.get(
    '/:id',
    jwtAuthMiddleware,
    requireRoles('admin', 'events:read'),
    async (c) => {
      const id = parseInt(c.req.param('id'), 10);
      const event = await eventService.findById(id);
      if (!event) {
        return c.json({ status: 404, title: 'Not Found', detail: 'Event not found' }, 404);
      }
      return c.json(event);
    },
  );

  // GET /events/:id/seats – admin or seats:list
  app.get(
    '/:id/seats',
    jwtAuthMiddleware,
    requireRoles('admin', 'seats:list'),
    async (c) => {
      const id = parseInt(c.req.param('id'), 10);
      const page = parseInt(c.req.query('page') ?? '0', 10);
      const pageSize = parseInt(c.req.query('pageSize') ?? '10', 10);
      const result = await eventService.findAllSeats(id, page, pageSize);
      return c.json(result);
    },
  );

  return app;
}
