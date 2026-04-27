import { DataSource } from 'typeorm';
import { LoginException } from '../exception/LoginException';
import { PasswordGrantTokenStrategy } from './strategy/PasswordGrantTokenStrategy';
import { ClientCredentialsTokenStrategy } from './strategy/ClientCredentialsTokenStrategy';
import { TokenStrategy, AccessTokenResponse } from './strategy/TokenStrategy';

export class AccessTokenService {
  private readonly strategies: Map<string, TokenStrategy>;

  constructor(dataSource: DataSource) {
    this.strategies = new Map<string, TokenStrategy>([
      ['password', new PasswordGrantTokenStrategy(dataSource)],
      ['client_credentials', new ClientCredentialsTokenStrategy(dataSource)],
    ]);
  }

  async getAccessToken(
    grantType: string,
    identifier: string,
    secret: string,
  ): Promise<AccessTokenResponse> {
    const strategy = this.strategies.get(grantType);

    if (!strategy) {
      throw new LoginException(
        'Invalid grant type',
        "Possible values are 'password' or 'client_credentials'",
      );
    }

    return strategy.generateToken(identifier, secret);
  }
}
