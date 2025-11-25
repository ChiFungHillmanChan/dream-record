import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Simple PrismaClient - uses DATABASE_URL from environment
// In dev: SQLite (file:./prisma/dev.db)
// In prod: PostgreSQL (Vercel Postgres)
export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
