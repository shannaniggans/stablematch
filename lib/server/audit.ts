import { prisma } from '@/lib/prisma';

interface AuditInput {
  practiceId: string;
  userId?: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'signin';
  diffJSON?: Record<string, unknown> | null;
}

export async function recordAuditLog(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        practiceId: input.practiceId,
        userId: input.userId,
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        diffJSON: input.diffJSON ? JSON.stringify(input.diffJSON) : undefined,
      },
    });
  } catch (error) {
    console.error('Failed to record audit log', error);
  }
}
