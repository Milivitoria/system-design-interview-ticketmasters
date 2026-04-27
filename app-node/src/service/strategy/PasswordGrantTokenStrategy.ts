import { hash, verify } from '@node-rs/bcrypt';
import { DataSource } from 'typeorm';
import { UserEntity } from '../../entity/UserEntity';
import { LoginException } from '../../exception/LoginException';
import { signJwt } from '../JwtService';
import { TokenStrategy, AccessTokenResponse } from './TokenStrategy';
import { config } from '../../config/config';

export class PasswordGrantTokenStrategy implements TokenStrategy {
  constructor(private readonly dataSource: DataSource) {}

  async generateToken(identifier: string, secret: string): Promise<AccessTokenResponse> {
    const userRepo = this.dataSource.getRepository(UserEntity);

    const user = await userRepo.findOne({
      where: { username: identifier },
      relations: ['role', 'role.scopes'],
    });

    if (!user) {
      throw new LoginException('Invalid credentials', 'Invalid username or password');
    }

    const passwordMatch = await verify(secret, user.password);
    if (!passwordMatch) {
      throw new LoginException('Invalid credentials', 'Invalid username or password');
    }

    const groups = extractGroupsFromRole(user);

    const accessToken = await signJwt({
      sub: String(user.id),
      upn: identifier,
      groups,
      email: user.email,
    });

    return { accessToken, expiresIn: config.jwt.expiresIn };
  }
}

function extractGroupsFromRole(user: UserEntity): string[] {
  const groups: string[] = [user.role.name];
  for (const scope of user.role.scopes) {
    groups.push(scope.name);
  }
  return groups;
}
