import { eq, and, desc } from 'drizzle-orm'
import { recoveryCodes, type RecoveryCode } from '../schema'
import type { DbConnection } from '../db'

export class RecoveryCodeRepository {
  constructor(private db: DbConnection) {}

  async createRecoveryCodes(userId: string, codeHashes: string[]): Promise<void> {
    const createdAt = Date.now()

    // Insert all codes in a batch
    for (const hash of codeHashes) {
      await this.db
        .insert(recoveryCodes)
        .values({
          user_id: userId,
          code_hash: hash,
          used: false,
          created_at: createdAt,
        })
        .run()
    }
  }

  async getRecoveryCodesByUser(userId: string): Promise<RecoveryCode[]> {
    const results = await this.db
      .select()
      .from(recoveryCodes)
      .where(eq(recoveryCodes.user_id, userId))
      .orderBy(desc(recoveryCodes.created_at))
      .all()

    return results
  }

  async getUnusedRecoveryCodeByHash(
    userId: string,
    codeHash: string
  ): Promise<RecoveryCode | null> {
    const result = await this.db
      .select()
      .from(recoveryCodes)
      .where(
        and(
          eq(recoveryCodes.user_id, userId),
          eq(recoveryCodes.code_hash, codeHash),
          eq(recoveryCodes.used, false)
        )
      )
      .get()

    return result ?? null
  }

  async markRecoveryCodeAsUsed(codeId: number): Promise<void> {
    const usedAt = Date.now()
    await this.db
      .update(recoveryCodes)
      .set({ used: true, used_at: usedAt })
      .where(eq(recoveryCodes.id, codeId))
      .run()
  }

  async deleteAllRecoveryCodes(userId: string): Promise<void> {
    await this.db.delete(recoveryCodes).where(eq(recoveryCodes.user_id, userId)).run()
  }
}
