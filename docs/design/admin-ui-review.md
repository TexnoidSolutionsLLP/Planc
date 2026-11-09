# Admin UI review

Source: [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md).

Resolved findings:

- `apps/admin/app/admin-theme.css:2` — Fixed: tiny type and inconsistent spacing; shared scale, stronger contrast and container-based reflow.
- `apps/admin/components/admin-overview.tsx:179` — Fixed: scaled chart labels and inaccessible data; HTML axes, fixed-size labels and keyboard-accessible data table.
- `apps/admin/components/admin-shell.tsx:57` — Fixed: popup dismissal and navigation affordances; Escape handling and visible focus.
- `apps/admin/app/layout.tsx:22` — Fixed: missing skip navigation to the main landmark.
- `packages/ui/src/components/table.tsx:6` — Fixed: admin tables lacked named keyboard-scrollable regions; other consumers retain default behavior.
- `apps/admin/app/login/login-form.tsx:35` — Fixed: sign-in feedback focus; errors are announced and referenced by the fields.
