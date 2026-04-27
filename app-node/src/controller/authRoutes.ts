import { Hono } from 'hono';
import { AccessTokenService } from '../service/AccessTokenService';
import { loginRequestSchema } from './dto/schemas';
import { TicketMasterException } from '../exception/TicketMasterException';

export function authRoutes(accessTokenService: AccessTokenService): Hono {
  const app = new Hono();

  app.post('/token', async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = loginRequestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ status: 400, title: 'Validation Error', detail: parsed.error.message }, 400);
    }

    const { grantType, identifier, secret } = parsed.data;

    try {
      const token = await accessTokenService.getAccessToken(grantType, identifier, secret);
      return c.json(token);
    } catch (err) {
      if (err instanceof TicketMasterException) {
        return c.json(err.body, err.statusCode as 401 | 422 | 500);
      }
      throw err;
    }
  });

  return app;
}
