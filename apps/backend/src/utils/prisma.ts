import { PrismaClient } from '@prisma/client';
import { readReplicas } from '@prisma/extension-read-replicas';

function makePrisma() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  });

  const replicaUrl = process.env.DATABASE_REPLICA_URL;
  if (replicaUrl) {
    const replica = new PrismaClient({ datasourceUrl: replicaUrl });
    return client.$extends(readReplicas({ replicas: [replica] })) as unknown as PrismaClient;
  }

  return client;
}

// Prevent multiple instances in development (hot reload)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || makePrisma();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
