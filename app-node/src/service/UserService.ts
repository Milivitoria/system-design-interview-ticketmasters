import { hash } from '@node-rs/bcrypt';
import { DataSource } from 'typeorm';
import { UserEntity } from '../entity/UserEntity';
import { RoleEntity } from '../entity/RoleEntity';
import { CreateEntityException } from '../exception/CreateEntityException';

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
}

export class UserService {
  constructor(private readonly dataSource: DataSource) {}

  async createUser(dto: CreateUserDto): Promise<UserEntity> {
    const userRepo = this.dataSource.getRepository(UserEntity);
    const roleRepo = this.dataSource.getRepository(RoleEntity);

    const count = await userRepo.count({
      where: [{ username: dto.username }, { email: dto.email }],
    });

    if (count > 0) {
      throw new CreateEntityException(
        'Create User Exception',
        'User already exists with this username or email',
      );
    }

    const role = await roleRepo.findOneBy({ name: 'user' });
    if (!role) {
      throw new CreateEntityException('Create User Exception', 'Default role not found');
    }

    const user = userRepo.create({
      username: dto.username,
      email: dto.email,
      password: await hash(dto.password, 10),
      role,
    });

    return userRepo.save(user);
  }

  async listUsers(): Promise<UserEntity[]> {
    return this.dataSource.getRepository(UserEntity).find({
      relations: ['role'],
    });
  }
}
