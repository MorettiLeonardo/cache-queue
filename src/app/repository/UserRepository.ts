import { getPool } from '../../config/database.js';
import type { UserEntity } from '../../types/entities/User.types.js';

export class UserRepository {
  private pool = getPool();

  public async create(name: string, email: string): Promise<UserEntity> {
    const query = `
      INSERT INTO users (name, email)
      VALUES ($1, $2)
      RETURNING id, name, email, created_at
    `;
    const { rows } = await this.pool.query<UserEntity>(query, [name, email]);
    return rows[0];
  }

  public async findById(id: number): Promise<UserEntity | null> {
    const query = `
      SELECT id, name, email, created_at
      FROM users
      WHERE id = $1
    `;
    const { rows } = await this.pool.query<UserEntity>(query, [id]);
    return rows[0] ?? null;
  }

  public async findByEmail(email: string): Promise<UserEntity | null> {
    const query = `
      SELECT id, name, email, created_at
      FROM users
      WHERE email = $1
    `;
    const { rows } = await this.pool.query<UserEntity>(query, [email]);
    return rows[0] ?? null;
  }
}
