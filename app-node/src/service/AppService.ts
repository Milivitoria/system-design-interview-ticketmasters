import { hash } from '@node-rs/bcrypt';
import { DataSource } from 'typeorm';
import { AppEntity } from '../entity/AppEntity';
import { ScopeEntity } from '../entity/ScopeEntity';
import { CreateEntityException } from '../exception/CreateEntityException';
import { randomUUID } from 'crypto';

export interface CreateAppDto {
  name: string;
  scopes: string[];
}

export interface CreateAppResponse {
  appId: number;
  clientId: string;
  clientSecret: string;
}

export class AppService {
  constructor(private readonly dataSource: DataSource) {}

  async createApp(dto: CreateAppDto): Promise<CreateAppResponse> {
    const appRepo = this.dataSource.getRepository(AppEntity);
    const scopeRepo = this.dataSource.getRepository(ScopeEntity);

    const existing = await appRepo.findOneBy({ name: dto.name });
    if (existing) {
      throw new CreateEntityException(
        'Create App Exception',
        'An app with this name already exists',
      );
    }

    if (!dto.scopes || dto.scopes.length === 0) {
      throw new CreateEntityException('Create App Exception', 'No scopes provided');
    }

    const scopeEntities: ScopeEntity[] = [];
    for (const scopeName of dto.scopes) {
      const scope = await scopeRepo.findOneBy({ name: scopeName });
      if (!scope) {
        throw new CreateEntityException(
          'Create App Exception',
          'There are invalid scopes provided',
        );
      }
      scopeEntities.push(scope);
    }

    const clientSecret = randomUUID();
    const app = appRepo.create({
      name: dto.name,
      clientId: randomUUID(),
      clientSecret: await hash(clientSecret, 10),
      scopes: scopeEntities,
    });

    await appRepo.save(app);

    return { appId: app.id, clientId: app.clientId, clientSecret };
  }
}
