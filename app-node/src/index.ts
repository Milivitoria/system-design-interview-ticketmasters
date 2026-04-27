import 'reflect-metadata';
import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { AppDataSource } from './database/data-source';
import { seed } from './database/seed';
import { config } from './config/config';

// Services
import { AccessTokenService } from './service/AccessTokenService';
import { UserService } from './service/UserService';
import { EventService } from './service/EventService';
import { BookingExpirationService } from './service/BookingExpirationService';
import { BookingService } from './service/BookingService';
import { UpdateBookingStatusService } from './service/UpdateBookingStatusService';
import { ExpireBookingService } from './service/ExpireBookingService';
import { AdminService } from './service/AdminService';
import { AppService } from './service/AppService';

// Routes
import { authRoutes } from './controller/authRoutes';
import { userRoutes } from './controller/userRoutes';
import { eventRoutes } from './controller/eventRoutes';
import { bookingRoutes } from './controller/bookingRoutes';
import { adminRoutes } from './controller/adminRoutes';
import { appRoutes } from './controller/appRoutes';

// SQS Listener
import { CheckBookingSqsListener } from './listener/CheckBookingSqsListener';

async function bootstrap() {
  // Initialize database
  await AppDataSource.initialize();
  console.info('[DB] Connected to PostgreSQL');

  // Seed reference data (scopes, roles)
  await seed(AppDataSource);
  console.info('[DB] Seed complete');

  // Instantiate services
  const accessTokenService = new AccessTokenService(AppDataSource);
  const userService = new UserService(AppDataSource);
  const eventService = new EventService(AppDataSource);
  const bookingExpirationService = new BookingExpirationService();
  const bookingService = new BookingService(AppDataSource, bookingExpirationService);
  const updateBookingStatusService = new UpdateBookingStatusService(AppDataSource);
  const expireBookingService = new ExpireBookingService(AppDataSource);
  const adminService = new AdminService(AppDataSource);
  const appService = new AppService(AppDataSource);

  // Start SQS listener
  const sqsListener = new CheckBookingSqsListener(expireBookingService);
  sqsListener.start();
  console.info('[SQS] Listener started');

  // Build Hono app
  const app = new Hono();

  app.route('/auth', authRoutes(accessTokenService));
  app.route('/users', userRoutes(userService));
  app.route('/events', eventRoutes(eventService));
  app.route('/bookings', bookingRoutes(bookingService, updateBookingStatusService));
  app.route('/setup-admin', adminRoutes(adminService));
  app.route('/apps', appRoutes(appService));

  // Global error handler
  app.onError((err, c) => {
    console.error('[Unhandled Error]', err);
    return c.json(
      { status: 500, title: 'Internal Server Error', detail: err.message },
      500,
    );
  });

  // Health check
  app.get('/health', (c) => c.json({ status: 'ok' }));

  // Start HTTP server
  serve({ fetch: app.fetch, port: config.port }, () => {
    console.info(`[HTTP] Server running on port ${config.port}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.info('[Shutdown] Stopping SQS listener...');
    sqsListener.stop();
    console.info('[Shutdown] Closing DB connection...');
    await AppDataSource.destroy();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  console.error('[Bootstrap] Failed to start application:', err);
  process.exit(1);
});
