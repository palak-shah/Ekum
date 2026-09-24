import { SettingsDomainCard } from '@/features/settings/SettingsDomainCard';

export function SettingsNavRows({
  items,
}: {
  items: { to: string; label?: string; title?: string; hint?: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <>
      {items.map((item) => (
        <SettingsDomainCard
          key={item.to}
          to={item.to}
          title={item.title ?? item.label ?? item.to}
          hint={item.hint ?? ''}
        />
      ))}
    </>
  );
}
