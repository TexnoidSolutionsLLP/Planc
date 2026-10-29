/**
 * List prices of the paid plans in ₹/month — the same figures shown on the
 * merchant billing page (apps/web/app/[store]/billing/page.tsx). Keep the two in step.
 */
export const PLAN_PRICE: Record<string, number> = { FREE: 0, PRO: 999, BUSINESS: 2499 };
export const PLAN_RANK: Record<string, number> = { FREE: 0, PRO: 1, BUSINESS: 2 };
export const PLANS = ["FREE", "PRO", "BUSINESS"] as const;

export function inr(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}
