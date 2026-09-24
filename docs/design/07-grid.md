# Grid

**Dashboard:** a 12-column fluid grid inside a max-width content area (1280px), with the 240px fixed sidebar
outside it. Stat cards and tables span the full content width; forms are constrained to ~640px (`max-w-2xl`)
for readability.

**Storefront:** a 6-column grid at mobile width collapsing product grids to 2 columns, growing to 3 columns at
`md` and 4 columns at `lg`, inside a 1152px max-width container (`max-w-6xl`).

Gutter is a consistent 16px on mobile, 24px on desktop, drawn from the spacing scale rather than a separate
grid-specific value.
