import { prisma } from "@/lib/db";

export async function writeAudit(input: {
  organizationId: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  studentId?: string;
  details?: string;
}) {
  await prisma.auditLog.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      studentId: input.studentId,
      details: input.details,
    },
  });
}
