# Cards

`packages/ui/src/components/card.tsx`: surface background, 1px border, 12px radius, 20–24px padding, **no shadow**.
Hierarchy comes from border, background and spacing rather than elevation. Shadows (`sm`/`md`/`lg`) are reserved
for floating layers: menus, toasts, modals and the marketing product preview.

Use a card only when grouping information helps. Metric cards (`StatCard`) are label → large number → change
indicator with an arrow icon and text (never color alone) → "vs previous N days". The comparison line is hidden
when both periods are empty, so a new store doesn't show meaningless "0.0%" trends.
