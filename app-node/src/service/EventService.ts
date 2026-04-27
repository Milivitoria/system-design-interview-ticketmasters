import { DataSource } from 'typeorm';
import { EventEntity } from '../entity/EventEntity';
import { SeatEntity } from '../entity/SeatEntity';
import { SeatStatus } from '../entity/SeatStatus';

export interface CreateEventDto {
  name: string;
  description: string;
  settings: { numberOfSeats: number };
}

export interface EventDto {
  id: number;
  name: string;
  description: string;
}

export interface SeatDto {
  seatId: number;
  name: string;
  status: string;
}

export interface ApiListDto<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

export class EventService {
  constructor(private readonly dataSource: DataSource) {}

  async findAll(page: number, pageSize: number): Promise<ApiListDto<EventDto>> {
    const repo = this.dataSource.getRepository(EventEntity);
    const [events, total] = await repo.findAndCount({
      skip: page * pageSize,
      take: pageSize,
    });

    const totalPages = Math.ceil(total / pageSize);

    return {
      data: events.map(toEventDto),
      pagination: { page, pageSize, totalPages, totalItems: total },
    };
  }

  async createEvent(dto: CreateEventDto): Promise<EventDto> {
    return this.dataSource.transaction(async (manager) => {
      const eventRepo = manager.getRepository(EventEntity);
      const seatRepo = manager.getRepository(SeatEntity);

      const event = eventRepo.create({ name: dto.name, description: dto.description });
      await eventRepo.save(event);

      for (let i = 0; i < dto.settings.numberOfSeats; i++) {
        const seat = seatRepo.create({
          event,
          name: `S${i}`,
          status: SeatStatus.AVAILABLE,
        });
        await seatRepo.save(seat);
      }

      return toEventDto(event);
    });
  }

  async findById(id: number): Promise<EventDto | null> {
    const repo = this.dataSource.getRepository(EventEntity);
    const event = await repo.findOneBy({ id });
    return event ? toEventDto(event) : null;
  }

  async findAllSeats(eventId: number, page: number, pageSize: number): Promise<ApiListDto<SeatDto>> {
    const eventRepo = this.dataSource.getRepository(EventEntity);
    const seatRepo = this.dataSource.getRepository(SeatEntity);

    const event = await eventRepo.findOneBy({ id: eventId });
    if (!event) {
      throw new Error('Event not found');
    }

    const [seats, total] = await seatRepo.findAndCount({
      where: { event: { id: eventId } },
      skip: page * pageSize,
      take: pageSize,
    });

    const totalPages = Math.ceil(total / pageSize);

    return {
      data: seats.map(toSeatDto),
      pagination: { page, pageSize, totalPages, totalItems: total },
    };
  }
}

function toEventDto(e: EventEntity): EventDto {
  return { id: e.id, name: e.name, description: e.description };
}

function toSeatDto(s: SeatEntity): SeatDto {
  return { seatId: s.id, name: s.name, status: s.status };
}
