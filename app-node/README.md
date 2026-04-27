# TicketMaster – Node.js / TypeScript / Hono

This is the Node.js + TypeScript port of the original Java/Quarkus TicketMaster backend.

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript (Node.js 20) |
| HTTP Server | [Hono](https://hono.dev/) + `@hono/node-server` |
| ORM | TypeORM 0.3 (PostgreSQL) |
| Auth | `jose` (RS256 JWT) |
| Password hashing | `@node-rs/bcrypt` |
| Validation | Zod |
| Async messaging | AWS SQS (`@aws-sdk/client-sqs`) |

## Project structure

```
src/
├── config/          config.ts – reads all env vars
├── database/        data-source.ts (TypeORM), seed.ts (reference data)
├── entity/          TypeORM entities + enums
├── exception/       Custom exception classes
├── service/         Business logic
│   └── strategy/   JWT token-generation strategies
├── middleware/      Hono JWT auth middleware
├── controller/      Hono route handlers
│   └── dto/         Zod validation schemas
├── listener/        SQS consumer (booking expiration)
└── index.ts         Entry point
```

## Quick start

### 1. Start infrastructure (Postgres + LocalStack)

```bash
cd ../docker
docker compose up -d
```

Then create the SQS queue:

```bash
aws --endpoint-url=http://localhost:4566 sqs create-queue --queue-name check-booking-pending-state
```

### 2. Configure environment

```bash
cp .env.example .env
# edit .env if needed (defaults match docker-compose)
```

### 3. Install and run

```bash
npm install
npm run dev        # development with hot-reload via tsx
```

### 4. Build for production

```bash
npm run build      # compiles TypeScript to dist/
npm start          # runs dist/index.js
```

## API Endpoints

All endpoints mirror the original Java app:

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/token` | public | Get JWT (password or client_credentials grant) |
| POST | `/setup-admin` | public | Create the first admin user |
| POST | `/users` | public | Register a new user |
| GET | `/users` | admin | List all users |
| GET | `/events` | authenticated | List events (paginated) |
| POST | `/events` | admin / events:create | Create event with seats |
| GET | `/events/:id` | admin / events:read | Get event by ID |
| GET | `/events/:id/seats` | admin / seats:list | List seats (paginated) |
| POST | `/bookings` | authenticated | Create a booking |
| POST | `/bookings/confirm` | admin / bookings:confirm | Confirm a booking |
| POST | `/bookings/reject` | admin / bookings:reject | Reject a booking |
| POST | `/apps` | admin | Register an OAuth client app |
| GET | `/health` | public | Health check |

## Notes

- Database schema is auto-synced via TypeORM `synchronize: true` (dev only — use migrations in production).
- RSA key pair in `src/keys/` is for **local development only**. Rotate keys in production.
- The SQS listener uses long-polling (20 s) to check for pending-booking expiration messages.
