import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from '../config/config';
import { UserEntity } from '../entity/UserEntity';
import { RoleEntity } from '../entity/RoleEntity';
import { ScopeEntity } from '../entity/ScopeEntity';
import { AppEntity } from '../entity/AppEntity';
import { EventEntity } from '../entity/EventEntity';
import { SeatEntity } from '../entity/SeatEntity';
import { BookingEntity } from '../entity/BookingEntity';
import { TicketEntity } from '../entity/TicketEntity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  username: config.db.username,
  password: config.db.password,
  synchronize: true,
  logging: false,
  entities: [
    UserEntity,
    RoleEntity,
    ScopeEntity,
    AppEntity,
    EventEntity,
    SeatEntity,
    BookingEntity,
    TicketEntity,
  ],
  migrations: [],
  subscribers: [],
});
