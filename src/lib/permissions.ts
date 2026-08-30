import type { MemberRole, TransactionVisibility } from "@prisma/client";

export class AuthorizationError extends Error {
  constructor(message = "You do not have access to this household.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function assertSameHousehold(
  memberHouseholdId: string,
  targetHouseholdId: string,
): void {
  if (memberHouseholdId !== targetHouseholdId) {
    throw new AuthorizationError();
  }
}

export function canManageHousehold(role: MemberRole): boolean {
  return role === "OWNER" || role === "PARTNER" || role === "ADULT";
}

export function canViewTransaction(input: {
  role: MemberRole;
  memberId: string;
  visibility: TransactionVisibility;
  paidByMemberId: string | null;
}): boolean {
  if (input.visibility === "SHARED") return true;
  if (input.role === "OWNER") return true;
  return input.paidByMemberId === input.memberId;
}

export function canEditFinances(role: MemberRole): boolean {
  return role !== "VIEWER" && role !== "DEPENDENT";
}
