# Buttons

`packages/ui/src/components/button.tsx`. 14px / 600, 8px radius, 150–200ms color transitions, a 3px blue focus ring.

- **Primary** — `#2563EB`, white text, hover `#1D4ED8`. One per screen or section.
- **Secondary** — surface with a border, hover to the page background. Cancel and secondary CTAs.
- **Ghost** — text only until hover. Tertiary actions.
- **Destructive** — `error` red, only for delete/cancel. Always confirmed in a dialog (`ConfirmAction`), with
  the safe "Keep it" option on the left.
- **Link** — brand-colored inline action.

Sizes: `default` is 44px tall on touch screens and 40px from `sm` up; `sm` is 36 / 32px; `lg` is 48 / 44px;
`icon` is square. Icon-only buttons must carry an `aria-label`.
