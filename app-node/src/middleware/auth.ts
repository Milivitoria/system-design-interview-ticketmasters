import { createMiddleware } from 'hono/factory';
import { verifyJwt, JwtPayload } from '../service/JwtService';

declare module 'hono' {
  interface ContextVariableMap {
    jwtPayload: JwtPayload;
  }
}

/**
 * Middleware that verifies the Bearer JWT and stores its payload in context.
 * Use `requireRoles` for role-based access control.
 */
export const jwtAuthMiddleware = createMiddleware(async (c, next) => {
  const authorization = c.req.header('Authorization');
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return c.json({ status: 401, title: 'Unauthorized', detail: 'Missing or invalid Authorization header' }, 401);
  }

  const token = authorization.slice('Bearer '.length);
  try {
    const payload = await verifyJwt(token);
    c.set('jwtPayload', payload);
  } catch {
    return c.json({ status: 401, title: 'Unauthorized', detail: 'Invalid or expired token' }, 401);
  }

  await next();
});

/**
 * Middleware factory that checks if the authenticated user has at least one of the
 * required roles/scopes (from the JWT `groups` claim).
 */
export function requireRoles(...roles: string[]) {
  return createMiddleware(async (c, next) => {
    const payload = c.get('jwtPayload');
    if (!payload) {
      return c.json({ status: 401, title: 'Unauthorized', detail: 'Not authenticated' }, 401);
    }

    const groups: string[] = payload.groups ?? [];
    const hasRole = roles.some((r) => groups.includes(r));
    if (!hasRole) {
      return c.json({ status: 403, title: 'Forbidden', detail: 'Insufficient permissions' }, 403);
    }

    await next();
  });
}
