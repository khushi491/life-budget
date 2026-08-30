import { describe, expect, it } from "vitest";
import {
  AuthorizationError,
  assertSameHousehold,
  canEditFinances,
  canViewTransaction,
} from "./permissions";

describe("household authorization", () => {
  it("blocks access across households", () => {
    expect(() => assertSameHousehold("hh_1", "hh_2")).toThrow(
      AuthorizationError,
    );
    expect(() => assertSameHousehold("hh_1", "hh_1")).not.toThrow();
  });

  it("hides private transactions from other partners unless owner", () => {
    expect(
      canViewTransaction({
        role: "PARTNER",
        memberId: "m1",
        visibility: "PRIVATE",
        paidByMemberId: "m2",
      }),
    ).toBe(false);
    expect(
      canViewTransaction({
        role: "OWNER",
        memberId: "m1",
        visibility: "PRIVATE",
        paidByMemberId: "m2",
      }),
    ).toBe(true);
  });

  it("prevents viewers and dependents from editing", () => {
    expect(canEditFinances("VIEWER")).toBe(false);
    expect(canEditFinances("DEPENDENT")).toBe(false);
    expect(canEditFinances("OWNER")).toBe(true);
  });
});
