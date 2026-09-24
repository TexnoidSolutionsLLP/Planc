# Modals

`Modal` (`packages/ui/src/components/modal.tsx`): 16px radius, max width 480px, 35% slate backdrop with a 2px blur,
title → description → content → actions with the primary action on the right. Escape and backdrop click close it,
focus moves into the dialog and returns on close, and page scroll is locked while open. On phones it anchors to
the bottom.

Used for destructive confirmations (`ConfirmAction`): delete product, cancel order, remove domain. Reversible
actions do not get a dialog.
