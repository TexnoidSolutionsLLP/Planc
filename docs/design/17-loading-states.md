# Loading States

Skeletons, not spinners. `Skeleton` is a neutral block with a faint shimmer; `app/[store]/loading.tsx` mirrors the
overview layout (title, four metric cards, chart) so nothing jumps when data arrives. Buttons show their own
pending label ("Saving…") via `useFormStatus`/`useTransition`. Content fades in over 450ms (`.page-enter`).
Reduced-motion users get instant state changes.
