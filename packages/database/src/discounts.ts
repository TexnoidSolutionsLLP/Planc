import { prisma } from "./index";

export interface DiscountApplication {
  discountId: string;
  code: string;
  amountOff: number;
  freeShipping: boolean;
}

export type DiscountValidationResult = { error: string } | { discount: DiscountApplication };

/**
 * Re-validates a discount code entirely server-side against current store
 * state — usage limits, dates, minimum order value and per-product/collection
 * scoping are all re-checked here rather than trusted from client input.
 */
export async function validateDiscountCode(
  storeId: string,
  rawCode: string,
  subtotal: number,
  productIds: string[]
): Promise<DiscountValidationResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { error: "Enter a discount code" };

  const discountCode = await prisma.discountCode.findFirst({
    where: { code, discount: { storeId } },
    include: { discount: true },
  });

  if (!discountCode) return { error: "This code isn't valid" };
  const discount = discountCode.discount;

  if (!discount.isActive) return { error: "This code is no longer active" };

  const now = new Date();
  if (discount.startsAt && now < discount.startsAt) return { error: "This code isn't active yet" };
  if (discount.endsAt && now > discount.endsAt) return { error: "This code has expired" };
  if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
    return { error: "This code has reached its usage limit" };
  }
  if (discount.minOrderValue && subtotal < Number(discount.minOrderValue)) {
    return { error: `Add ₹${(Number(discount.minOrderValue) - subtotal).toFixed(0)} more to use this code` };
  }

  if (!discount.appliesToAll) {
    const eligible = productIds.some((id) => discount.productIds.includes(id));
    if (!eligible) return { error: "This code doesn't apply to the items in your cart" };
  }

  let amountOff = 0;
  let freeShipping = false;

  switch (discount.type) {
    case "PERCENTAGE":
      amountOff = Math.round((subtotal * Number(discount.value)) / 100);
      break;
    case "FIXED_AMOUNT":
      amountOff = Math.min(Number(discount.value), subtotal);
      break;
    case "FREE_SHIPPING":
      freeShipping = true;
      break;
    case "BUY_X_GET_Y":
      // Not yet computed line-by-line — treated as no-op discount amount until
      // per-line eligibility rules are modeled; the code still records usage.
      break;
  }

  return { discount: { discountId: discount.id, code: discountCode.code, amountOff, freeShipping } };
}

export async function recordDiscountUsage(discountId: string) {
  await prisma.discount.update({ where: { id: discountId }, data: { usageCount: { increment: 1 } } });
}
