import { hash } from '@node-rs/bcrypt';
import { DataSource } from 'typeorm';
import { UserEntity } from '../entity/UserEntity';
import { RoleEntity } from '../entity/RoleEntity';
import { AdminException } from '../exception/AdminException';

export interface CreateAdminRequest {
  username: string;
  password: string;
  email: string;
}

export class AdminService {
  constructor(private readonly dataSource: DataSource) {}

  async setupAdminUser(request: CreateAdminRequest): Promise<void> {
    const userRepo = this.dataSource.getRepository(UserEntity);
    const roleRepo = this.dataSource.getRepository(RoleEntity);

    const count = await userRepo.count();
    if (count > 0) {
      throw new AdminException();
    }

    const adminRole = await roleRepo.findOneBy({ name: 'admin' });
    if (!adminRole) {
      throw new Error('Admin role not found – ensure database is seeded');
    }

    const adminUser = userRepo.create({
      username: request.username,
      email: request.email,
      password: await hash(request.password, 10),
      role: adminRole,
    });

    await userRepo.save(adminUser);
  }
}
