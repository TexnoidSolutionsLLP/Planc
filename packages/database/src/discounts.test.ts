import { describe, it, expect, vi, beforeEach } from "vitest";

const findFirst = vi.fn();

vi.mock("./index", () => ({
  prisma: {
    discountCode: { findFirst: (...args: unknown[]) => findFirst(...args) },
    discount: { update: vi.fn() },
  },
}));

import { validateDiscountCode } from "./discounts";

function makeDiscountCode(overrides: Partial<any> = {}) {
  return {
    code: "SAVE20",
    discount: {
      id: "disc_1",
      storeId: "store_1",
      isActive: true,
      startsAt: null,
      endsAt: null,
      usageLimit: null,
      usageCount: 0,
      minOrderValue: null,
      appliesToAll: true,
      productIds: [],
      type: "PERCENTAGE",
      value: 20,
      ...overrides,
    },
  };
}

describe("validateDiscountCode", () => {
  beforeEach(() => {
    findFirst.mockReset();
  });

  it("rejects an unknown code", async () => {
    findFirst.mockResolvedValue(null);
    const result = await validateDiscountCode("store_1", "NOPE", 1000, []);
    expect("error" in result && result.error).toMatch(/valid/i);
  });

  it("computes a percentage discount correctly", async () => {
    findFirst.mockResolvedValue(makeDiscountCode());
    const result = await validateDiscountCode("store_1", "save20", 1000, []);
    expect("discount" in result && result.discount.amountOff).toBe(200);
  });

  it("caps a fixed-amount discount at the subtotal", async () => {
    findFirst.mockResolvedValue(makeDiscountCode({ type: "FIXED_AMOUNT", value: 5000 }));
    const result = await validateDiscountCode("store_1", "SAVE20", 1000, []);
    expect("discount" in result && result.discount.amountOff).toBe(1000);
  });

  it("rejects a code that hasn't started yet", async () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    findFirst.mockResolvedValue(makeDiscountCode({ startsAt: future }));
    const result = await validateDiscountCode("store_1", "SAVE20", 1000, []);
    expect("error" in result && result.error).toMatch(/isn't active yet/i);
  });

  it("rejects an expired code", async () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
    findFirst.mockResolvedValue(makeDiscountCode({ endsAt: past }));
    const result = await validateDiscountCode("store_1", "SAVE20", 1000, []);
    expect("error" in result && result.error).toMatch(/expired/i);
  });

  it("rejects a code that has hit its usage limit", async () => {
    findFirst.mockResolvedValue(makeDiscountCode({ usageLimit: 5, usageCount: 5 }));
    const result = await validateDiscountCode("store_1", "SAVE20", 1000, []);
    expect("error" in result && result.error).toMatch(/usage limit/i);
  });

  it("rejects when the order is below the minimum", async () => {
    findFirst.mockResolvedValue(makeDiscountCode({ minOrderValue: 2000 }));
    const result = await validateDiscountCode("store_1", "SAVE20", 1000, []);
    expect("error" in result).toBe(true);
  });

  it("rejects a product-scoped code when no cart item is eligible", async () => {
    findFirst.mockResolvedValue(makeDiscountCode({ appliesToAll: false, productIds: ["prod_x"] }));
    const result = await validateDiscountCode("store_1", "SAVE20", 1000, ["prod_y"]);
    expect("error" in result && result.error).toMatch(/doesn't apply/i);
  });

  it("allows a product-scoped code when a cart item matches", async () => {
    findFirst.mockResolvedValue(makeDiscountCode({ appliesToAll: false, productIds: ["prod_x"] }));
    const result = await validateDiscountCode("store_1", "SAVE20", 1000, ["prod_x", "prod_y"]);
    expect("discount" in result).toBe(true);
  });

  it("flags free shipping discounts without a monetary amount off", async () => {
    findFirst.mockResolvedValue(makeDiscountCode({ type: "FREE_SHIPPING", value: 0 }));
    const result = await validateDiscountCode("store_1", "SAVE20", 1000, []);
    expect("discount" in result && result.discount.freeShipping).toBe(true);
    expect("discount" in result && result.discount.amountOff).toBe(0);
  });
});
