import { Hono } from 'hono';
import { AppService } from '../service/AppService';
import { jwtAuthMiddleware, requireRoles } from '../middleware/auth';
import { createAppSchema } from './dto/schemas';
import { TicketMasterException } from '../exception/TicketMasterException';

export function appRoutes(appService: AppService): Hono {
  const app = new Hono();

  // POST /apps – admin only
  app.post('/', jwtAuthMiddleware, requireRoles('admin'), async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = createAppSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ status: 400, title: 'Validation Error', detail: parsed.error.message }, 400);
    }

    try {
      const result = await appService.createApp(parsed.data);
      c.header('Location', `/apps/${result.appId}`);
      return c.json(result, 201);
    } catch (err) {
      if (err instanceof TicketMasterException) {
        return c.json(err.body, err.statusCode as 401 | 422 | 500);
      }
      throw err;
    }
  });

  return app;
}
