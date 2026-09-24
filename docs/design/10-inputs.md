# Inputs

All inputs (`packages/ui/src/components/input.tsx`) share: 44px height (except textarea), 1px `border` token,
`sm` (6px) radius, `accent`-colored 2px focus ring, `muted` placeholder text.

- **Text/number/email/tel** — `Input`.
- **Long text** — `Textarea`, min-height 96px, resizes vertically.
- **Choice from a short fixed list** — native `Select` (styled to match), used for status/type fields rather
  than a custom dropdown component, for accessibility and mobile keyboard behavior.
- **Labels** — always visible above the field (`Label` component), never placeholder-as-label.
- **Validation** — errors render as `error`-colored small text directly below the field/form; the field
  border does not need to change color when a form-level error message is already shown.
