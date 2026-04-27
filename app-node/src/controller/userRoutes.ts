import { Hono } from 'hono';
import { UserService } from '../service/UserService';
import { jwtAuthMiddleware, requireRoles } from '../middleware/auth';
import { createUserSchema } from './dto/schemas';
import { TicketMasterException } from '../exception/TicketMasterException';

export function userRoutes(userService: UserService): Hono {
  const app = new Hono();

  // POST /users – public
  app.post('/', async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ status: 400, title: 'Validation Error', detail: parsed.error.message }, 400);
    }

    try {
      const user = await userService.createUser(parsed.data);
      c.header('Location', `/users/${user.id}`);
      return c.json({ id: user.id, username: user.username, email: user.email }, 201);
    } catch (err) {
      if (err instanceof TicketMasterException) {
        return c.json(err.body, err.statusCode as 401 | 422 | 500);
      }
      throw err;
    }
  });

  // GET /users – admin only
  app.get('/', jwtAuthMiddleware, requireRoles('admin'), async (c) => {
    const users = await userService.listUsers();
    return c.json(
      users.map((u) => ({ id: u.id, username: u.username, email: u.email, role: u.role?.name })),
    );
  });

  return app;
}
