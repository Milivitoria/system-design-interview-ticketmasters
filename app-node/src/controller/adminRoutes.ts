import { Hono } from 'hono';
import { AdminService } from '../service/AdminService';
import { createAdminSchema } from './dto/schemas';
import { TicketMasterException } from '../exception/TicketMasterException';

export function adminRoutes(adminService: AdminService): Hono {
  const app = new Hono();

  // POST /setup-admin – public (only works when no users exist)
  app.post('/', async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = createAdminSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ status: 400, title: 'Validation Error', detail: parsed.error.message }, 400);
    }

    try {
      await adminService.setupAdminUser(parsed.data);
      return c.json({ ok: true });
    } catch (err) {
      if (err instanceof TicketMasterException) {
        return c.json(err.body, err.statusCode as 401 | 422 | 500);
      }
      throw err;
    }
  });

  return app;
}
