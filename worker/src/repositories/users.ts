import { eq } from 'drizzle-orm'
import { users, type User } from '../schema'
import type { DbConnection } from '../db'

export class UserRepository {
  constructor(private db: DbConnection) {}

  async getUser(userId: string): Promise<User | null> {
    const result = await this.db.select().from(users).where(eq(users.id, userId)).get()
    return result ?? null
  }

  async createUser(userId: string): Promise<User> {
    const createdAt = Date.now()
    const newUser = { id: userId, created_at: createdAt }
    await this.db.insert(users).values(newUser).run()
    return newUser
  }
}
