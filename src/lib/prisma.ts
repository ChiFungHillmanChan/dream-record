import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  // In production (Vercel), use PostgreSQL directly
  if (process.env.NODE_ENV === 'production') {
    return new PrismaClient();
  }
  
  // In development, use SQLite with adapter (dynamic import to avoid bundling in prod)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path');
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    const adapter = new PrismaBetterSqlite3({ url: dbPath });
    return new PrismaClient({ adapter });
  } catch {
    // Fallback to standard client if SQLite adapter not available
    return new PrismaClient();
  }
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
