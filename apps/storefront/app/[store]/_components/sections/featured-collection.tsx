export function FeaturedCollectionSection({ name }: { name?: string }) {
  if (!name) return null;
  return (
    <div className="mx-auto max-w-6xl px-4 pt-14">
      <p className="text-caption font-semibold uppercase tracking-[0.2em] text-accent">Featured collection</p>
      <h2 className="mt-1 text-h2 text-primary">{name}</h2>
    </div>
  );
}
