import { DataSource } from 'typeorm';
import { RoleEntity } from '../entity/RoleEntity';
import { ScopeEntity } from '../entity/ScopeEntity';

/**
 * Seeds the database with the required scopes and roles if they don't exist yet.
 * Mirrors the content of the Java app's import.sql.
 */
export async function seed(dataSource: DataSource): Promise<void> {
  const scopeRepo = dataSource.getRepository(ScopeEntity);
  const roleRepo = dataSource.getRepository(RoleEntity);

  const scopeDefs = [
    { id: 1, name: 'events:list' },
    { id: 2, name: 'events:read' },
    { id: 3, name: 'seats:list' },
    { id: 4, name: 'bookings:reserve' },
    { id: 5, name: 'bookings:confirm' },
    { id: 6, name: 'bookings:reject' },
  ];

  for (const def of scopeDefs) {
    const existing = await scopeRepo.findOneBy({ name: def.name });
    if (!existing) {
      const scope = scopeRepo.create({ name: def.name });
      await scopeRepo.save(scope);
    }
  }

  const allScopes = await scopeRepo.find();
  const byName = (name: string) => allScopes.find((s) => s.name === name)!;

  const roleDefs: Array<{ name: string; scopeNames: string[] }> = [
    {
      name: 'user',
      scopeNames: ['events:list', 'events:read', 'seats:list', 'bookings:reserve'],
    },
    { name: 'admin', scopeNames: [] },
    { name: 'payment_gtw', scopeNames: ['bookings:confirm', 'bookings:reject'] },
  ];

  for (const def of roleDefs) {
    const existing = await roleRepo.findOneBy({ name: def.name });
    if (!existing) {
      const role = roleRepo.create({
        name: def.name,
        scopes: def.scopeNames.map(byName),
      });
      await roleRepo.save(role);
    }
  }
}
