import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { BroadcastListView } from '@ekum/domain-types';
import { RateVisibility } from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { PageHeader } from '@/ui/PageHeader';
import { Button, Card, EmptyState, LoadingBlock, SectionHeader } from '@/ui/kit';
import { BuyerGroupFormSheet } from './BuyerGroupFormSheet';

function groupSummary(list: BroadcastListView): string {
  const inherit =
    list.defaultRateVisibility == null && list.allowForward == null;
  if (inherit) return 'same as my usual';
  const rates =
    list.defaultRateVisibility === RateVisibility.Visible ? 'rates visible' : 'rates on request';
  const forward =
    list.allowForward === false ? ' · buyers can’t forward' : ' · buyers can forward';
  return `${rates}${list.allowForward == null ? '' : forward}`;
}

export function BroadcastPage() {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<BroadcastListView | null>(null);

  const lists = useQuery({
    queryKey: ['broadcast-lists'],
    queryFn: () => api.get<BroadcastListView[]>('/broadcasts/lists'),
  });

  const openCreate = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  const openEdit = (list: BroadcastListView) => {
    setEditing(list);
    setSheetOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Buyer groups"
        action={
          <button className="text-sm font-medium text-accent" onClick={() => navigate('/broadcast/new')}>
            Compose
          </button>
        }
      />

      <Card className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">Send to many at once</p>
          <p className="text-xs text-muted">Reach selected buyers or a saved group.</p>
        </div>
        <Button onClick={() => navigate('/broadcast/new')}>New</Button>
      </Card>

      <section className="flex flex-col gap-2">
        <SectionHeader
          title="Groups"
          action={
            <button className="text-xs font-medium text-accent" onClick={openCreate}>
              Add group
            </button>
          }
        />
        {lists.isLoading ? (
          <LoadingBlock />
        ) : lists.data && lists.data.length > 0 ? (
          lists.data.map((list) => (
            <Card key={list.id} className="flex flex-col gap-2">
              <button
                type="button"
                className="flex items-center justify-between text-left"
                onClick={() => openEdit(list)}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{list.name}</p>
                  <p className="text-xs text-muted">
                    {list.memberCount} buyers · {groupSummary(list)}
                  </p>
                </div>
                <span className="text-xs font-medium text-accent">Edit</span>
              </button>
            </Card>
          ))
        ) : (
          <EmptyState
            title="No buyer groups"
            message="Group connections for private publish, share, and broadcast."
            action={<Button onClick={openCreate}>Add group</Button>}
          />
        )}
      </section>

      <BuyerGroupFormSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
        }}
        editing={editing}
        allowDelete
      />
    </div>
  );
}
