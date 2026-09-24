import { cache } from "react";
import { prisma } from "@sellly/database";
import { getTemplate, normalizeThemeConfig } from "@sellly/theme";

/** Active theme row → template definition + merchant config, deduped per request. */
export const getActiveTemplate = cache(async (storeId: string) => {
  const theme = await prisma.theme.findFirst({ where: { storeId, isActive: true } });
  return {
    template: getTemplate(theme?.baseTheme ?? theme?.name),
    config: normalizeThemeConfig(theme?.config),
  };
});
