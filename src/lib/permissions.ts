import type { Role } from "@/lib/constants";

export type Permission =
  | "student.list"
  | "student.view"
  | "student.create"
  | "student.update"
  | "student.archive"
  | "student.export"
  | "goal.create"
  | "goal.update"
  | "goal.share"
  | "progress.create"
  | "progress.view"
  | "report.create"
  | "message.send"
  | "team.manage"
  | "privacy.manage"
  | "audit.view"
  | "search.staff";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMINISTRATOR: [
    "student.list",
    "student.view",
    "student.create",
    "student.update",
    "student.archive",
    "student.export",
    "goal.create",
    "goal.update",
    "goal.share",
    "progress.create",
    "progress.view",
    "report.create",
    "message.send",
    "team.manage",
    "privacy.manage",
    "audit.view",
    "search.staff",
  ],
  EDUCATOR: [
    "student.list",
    "student.view",
    "student.create",
    "student.update",
    "student.export",
    "goal.create",
    "goal.update",
    "goal.share",
    "progress.create",
    "progress.view",
    "report.create",
    "message.send",
    "search.staff",
  ],
  PROVIDER: [
    "student.list",
    "student.view",
    "progress.create",
    "progress.view",
    "report.create",
    "message.send",
    "search.staff",
  ],
  PARENT: ["student.view", "progress.view", "report.create", "message.send"],
};

export function can(role: Role, permission: Permission) {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function isStaff(role: Role) {
  return role !== "PARENT";
}

export type StudentAccessContext = {
  userId: string;
  role: Role;
  organizationId: string;
  caseManagerId: string;
  providerIds: string[];
  guardianUserIds: string[];
  sharedGoalIds?: string[];
};

/**
 * Least-privilege student access:
 * - Administrators: any student in the same organization
 * - Educators: case-managed students
 * - Providers: assigned students only
 * - Parents: linked students only, and only shared goals
 */
export function canAccessStudent(
  ctx: StudentAccessContext,
  options: { goalId?: string; goalShared?: boolean } = {},
) {
  if (ctx.role === "ADMINISTRATOR") return true;
  if (ctx.role === "EDUCATOR") return ctx.caseManagerId === ctx.userId;
  if (ctx.role === "PROVIDER") return ctx.providerIds.includes(ctx.userId);
  if (ctx.role === "PARENT") {
    if (!ctx.guardianUserIds.includes(ctx.userId)) return false;
    if (options.goalId) return options.goalShared === true;
    return true;
  }
  return false;
}

export const PERMISSION_MATRIX: {
  capability: string;
  administrator: string;
  educator: string;
  provider: string;
  parent: string;
}[] = [
  {
    capability: "View student profile (minimum fields)",
    administrator: "All students in the school",
    educator: "Case-managed students",
    provider: "Assigned students",
    parent: "Linked student only",
  },
  {
    capability: "Create or edit IEP goals",
    administrator: "Yes",
    educator: "Yes",
    provider: "View only",
    parent: "Shared goals only",
  },
  {
    capability: "Record progress entries",
    administrator: "Yes",
    educator: "Yes",
    provider: "Assigned students",
    parent: "No",
  },
  {
    capability: "Generate progress reports",
    administrator: "Yes",
    educator: "Yes",
    provider: "Assigned students",
    parent: "Shared reports only",
  },
  {
    capability: "Team and role management",
    administrator: "Yes",
    educator: "No",
    provider: "No",
    parent: "No",
  },
  {
    capability: "Privacy, retention, and deletion",
    administrator: "Yes",
    educator: "View notice",
    provider: "View notice",
    parent: "View notice and consent",
  },
  {
    capability: "Audit history and staff export",
    administrator: "Yes",
    educator: "Export own caseload",
    provider: "Export assigned students",
    parent: "No",
  },
];
