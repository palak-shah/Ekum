import type { CollectionCard } from '@ekum/domain-types';
import { receivedDayLabel } from '@/features/explore/exploreTradeSide';

export interface HomeReceivedRow {
  id: string;
  title: string;
  subtitle: string;
  to: string;
  sortAt: string;
}

export function homeReceivedRows(packs: CollectionCard[], now = Date.now()): HomeReceivedRow[] {
  return packs.map((pack) => {
    const day = pack.updatedAt.slice(0, 10);
    return {
      id: `pack-${pack.id}`,
      title: pack.name,
      subtitle: `${pack.company.name} · ${receivedDayLabel(day, new Date(now))}`,
      to: `/collections/${pack.id}`,
      sortAt: pack.updatedAt,
    };
  });
}
