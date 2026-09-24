import { prisma } from "./index";

/**
 * Every mutation that changes money, fulfillment state, store settings or
 * account access writes one of these. It's the trail platform admin and
 * support use to answer "what happened to this order/store" after the fact.
 */
export async function writeAuditLog(input: {
  storeId?: string;
  userId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      storeId: input.storeId,
      userId: input.userId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      metadata: input.metadata as any,
    },
  });
}
