import { verify } from '@node-rs/bcrypt';
import { DataSource } from 'typeorm';
import { AppEntity } from '../../entity/AppEntity';
import { LoginException } from '../../exception/LoginException';
import { signJwt } from '../JwtService';
import { TokenStrategy, AccessTokenResponse } from './TokenStrategy';
import { config } from '../../config/config';

export class ClientCredentialsTokenStrategy implements TokenStrategy {
  constructor(private readonly dataSource: DataSource) {}

  async generateToken(identifier: string, secret: string): Promise<AccessTokenResponse> {
    const appRepo = this.dataSource.getRepository(AppEntity);

    const app = await appRepo.findOne({
      where: { clientId: identifier },
      relations: ['scopes'],
    });

    if (!app) {
      throw new LoginException('Invalid credentials', 'Invalid client ID or client secret');
    }

    const secretMatch = await verify(secret, app.clientSecret);
    if (!secretMatch) {
      throw new LoginException('Invalid credentials', 'Invalid client ID or client secret');
    }

    const groups = app.scopes.map((s) => s.name);

    const accessToken = await signJwt({
      sub: String(app.id),
      upn: app.clientId,
      groups,
      app_name: app.name,
    });

    return { accessToken, expiresIn: config.jwt.expiresIn };
  }
}
