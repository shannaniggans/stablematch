// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Avoid instantiating multiple Prisma clients in dev (Next.js hot reload)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ['query', 'error', 'warn'] });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
