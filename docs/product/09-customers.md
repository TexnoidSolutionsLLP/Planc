# Customers

A `Customer` record is created (or matched by phone number) automatically at checkout — there is no separate
customer signup/account system in v1; this matches how social sellers already think about buyers ("the
person who DMs me"), not how a traditional e-commerce account system works.

## Profile
Name, email, phone, addresses, and derived metrics: order count, total spent, average order value — computed
from the customer's `Order` relation rather than stored as denormalized columns, so they're always accurate
(`apps/web/app/[store]/customers/[id]/page.tsx`).

## Matching
Customers are matched by phone number within a store (`upsertByPhone` in `packages/database/src/tenant.ts`)
since phone, not email, is the reliable identifier for this audience — many customers check out without an
email address.

## Future
Customer-facing accounts (login, saved addresses, order history without re-entering a phone number) are
listed as a Phase 2 feature in the original blueprint but are not required for the core loop and are not yet
built.
