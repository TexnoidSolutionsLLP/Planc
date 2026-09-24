import { prisma } from "@sellly/database";
import { getTemplate, normalizeThemeConfig } from "@sellly/theme";
import { Badge, Card, CardHeader, CardTitle } from "@sellly/ui";
import { requireStore } from "@/lib/session";
import { ThemeEditor } from "./_components/theme-editor";
import { ThemePicker } from "./_components/theme-picker";
import { AiStoreBuilder } from "./_components/ai-store-builder";

export default async function OnlineStorePage({ params }: { params: { store: string } }) {
  const { store } = await requireStore(params.store);
  const theme = await prisma.theme.findFirst({ where: { storeId: store.id, isActive: true } });
  const config = normalizeThemeConfig(theme?.config);
  const template = getTemplate(theme?.baseTheme ?? theme?.name);

  const storefrontUrl = process.env.STOREFRONT_URL ?? "http://localhost:3001";
  const previewUrl = `${storefrontUrl}/${store.slug}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title text-primary">Online Store</h1>
          <p className="text-body text-muted">Customize your storefront's theme and layout.</p>
        </div>
        <AiStoreBuilder storeSlug={store.slug} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
        </CardHeader>
        <ThemePicker storeSlug={store.slug} activeTheme={theme ? template.id : undefined} />
      </Card>

      {theme ? (
        <ThemeEditor storeSlug={store.slug} initialConfig={config} previewUrl={previewUrl} defaultAccent={template.colors.accent} />
      ) : (
        <Card>
          <p className="text-small text-muted">Choose a theme above to start customizing your storefront.</p>
        </Card>
      )}
    </div>
  );
}
