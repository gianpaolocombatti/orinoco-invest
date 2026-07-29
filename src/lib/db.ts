import { PrismaClient, Prisma } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// Postgres error codes for connection/statement issues that PgBouncer's
// transaction-mode pooling can intermittently surface under serverless
// concurrency (e.g. a pooled connection reassigned mid-request).
const RETRYABLE_POSTGRES_CODES = new Set([
  '08000', // connection_exception
  '08003', // connection_does_not_exist
  '08006', // connection_failure
  '26000', // invalid_sql_statement_name (stale prepared statement)
  '42P05', // duplicate_prepared_statement
]);

function isRetryableDbError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Prisma.PrismaClientRustPanicError) return true;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P1001' || error.code === 'P1017' || error.code === 'P2024') return true;
    const pgCode = (error.meta as { code?: string } | undefined)?.code;
    if (pgCode && RETRYABLE_POSTGRES_CODES.has(pgCode)) return true;
  }
  return false;
}

/**
 * Retries a DB operation on transient connection-level failures only.
 * Real errors (validation, constraint violations, not-found, etc.) fail fast.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts: number = 3
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRetryableDbError(error) || i === attempts - 1) {
        throw error;
      }
      console.warn(`DB operation failed (attempt ${i + 1}/${attempts}), retrying:`, error);
      await new Promise((resolve) => setTimeout(resolve, 150 * (i + 1)));
    }
  }
  throw lastError;
}
