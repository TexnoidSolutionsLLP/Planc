# Animation

Easing is `cubic-bezier(0.22, 1, 0.36, 1)` (`ease-premium`). Durations: 150ms for hover and micro-interactions,
200ms for buttons, menus and toasts, 300ms for the drawer and modals, 450–600ms for page entrance and chart
drawing. Animated: button and row hover, menu/toast/modal entrance, sidebar drawer, chart render, page entrance.
Not animated: anything decorative or continuous — no floating elements or auto-playing motion.
`prefers-reduced-motion` collapses everything to near-instant.
