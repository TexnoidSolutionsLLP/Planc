# Products

## Fields
Name, description, price, compare-at price, cost, SKU, barcode, inventory quantity, weight, shipping
requirement, tags, SEO title/description, images, variants, options, collections. See `Product`,
`ProductVariant`, `ProductOption`, `ProductImage` in `packages/database/prisma/schema.prisma`.

## States
`DRAFT` (not visible on storefront), `ACTIVE` (visible, purchasable if in stock), `ARCHIVED` (hidden,
retained for historical order records). "Out of stock" is derived from `inventoryQty === 0` on an `ACTIVE`
product rather than being a separate status, so a restock doesn't require a manual status change.

## Variants & options
Options (e.g. "Size", "Color") are defined per product with a list of possible values; variants are the
concrete combinations (e.g. "Red / Large") each with their own optional price override, SKU and inventory.
The storefront product page renders one selector per option (`AddToCartForm`) and resolves the selected
combination to a variant title shown on the cart line and order item.

## Bulk actions
`bulkUpdateStatusAction` (`apps/web/lib/actions/products.ts`) supports moving many products between
Draft/Active/Archived at once — the first bulk-management need resellers with larger catalogs run into.
