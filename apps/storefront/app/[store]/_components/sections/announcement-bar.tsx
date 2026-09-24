export function AnnouncementBar({ text }: { text?: string }) {
  if (!text) return null;
  return <div className="bg-primary px-4 py-2 text-center text-caption text-background">{text}</div>;
}
