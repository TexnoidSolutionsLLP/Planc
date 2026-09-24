# Dark Mode

Toggle in the dashboard and admin top bars (`ThemeToggle`); the choice is stored in `localStorage`
(`sellly-theme`) and applied by an inline script in `<head>` before first paint, so there is no flash. Default is
light. Dark tokens: background `#09090B`, surface `#111113`, secondary surface `#18181B`, border `#27272A`,
text `#FAFAFA` / `#A1A1AA` / `#71717A`, brand `#3B82F6`. Shadows deepen rather than disappear. The storefront is
always light so merchants' brand colors render predictably.
