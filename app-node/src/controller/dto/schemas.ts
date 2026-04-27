import { z } from 'zod';

export const loginRequestSchema = z.object({
  grantType: z.string().min(1),
  identifier: z.string().min(1),
  secret: z.string().min(1),
});

export const createUserSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email().min(3).max(100),
  password: z.string().min(4).max(16),
});

export const createEventSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  settings: z.object({
    numberOfSeats: z.number().int().min(1),
  }),
});

export const createBookingSchema = z.object({
  eventId: z.number().int().min(1),
  seats: z.array(z.object({ seatId: z.number().int().min(1) })).min(1),
});

export const confirmBookingSchema = z.object({
  bookingId: z.number().int().min(1),
});

export const rejectBookingSchema = z.object({
  bookingId: z.number().int().min(1),
});

export const createAdminSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  email: z.string().min(1),
});

export const createAppSchema = z.object({
  name: z.string().min(1),
  scopes: z.array(z.string().min(1)).min(1),
});
