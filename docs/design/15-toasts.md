# Toasts

`ToastProvider` / `useToast` (`packages/ui/src/components/toast.tsx`), mounted in the dashboard root layout.
Top-right, 320–380px wide, 12px radius. Each toast has an icon, title, optional description and optional action.
Enter animation is a 200ms fade plus 10px slide with `cubic-bezier(0.22, 1, 0.36, 1)`. Success and info dismiss
after 4.5s, errors after 7s; at most three are stacked. Announced through an `aria-live="polite"` region.

Wired to: settings saved, Razorpay connected, domain verification result, and store-link copy.
