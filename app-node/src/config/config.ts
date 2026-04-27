import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT ?? '8080', 10),

  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    name: process.env.DB_NAME ?? 'ticketmasterdb',
    username: process.env.DB_USERNAME ?? 'ticketmaster',
    password: process.env.DB_PASSWORD ?? 'ticketmaster',
  },

  jwt: {
    privateKeyPath: process.env.JWT_PRIVATE_KEY_PATH ?? 'src/keys/rsaPrivateKey.pem',
    publicKeyPath: process.env.JWT_PUBLIC_KEY_PATH ?? 'src/keys/publicKey.pem',
    issuer: process.env.JWT_ISSUER ?? 'ticketmaster',
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN ?? '300', 10),
  },

  aws: {
    region: process.env.AWS_REGION ?? 'sa-east-1',
    endpointUrl: process.env.AWS_ENDPOINT_URL,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'test-key',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'test-secret',
  },

  sqs: {
    queueName: process.env.SQS_QUEUE_NAME ?? 'check-booking-pending-state',
    bookingExpirationCheckSeconds: parseInt(
      process.env.BOOKING_EXPIRATION_CHECK_SECONDS ?? '30',
      10,
    ),
  },
};
