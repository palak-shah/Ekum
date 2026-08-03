import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BroadcastListView } from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { PageHeader } from '@/ui/PageHeader';
import { Button, Card, EmptyState, Field, LoadingBlock, SectionHeader, Sheet, TextInput } from '@/ui/kit';

export function BroadcastPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [listOpen, setListOpen] = useState(false);
  const [name, setName] = useState('');

  const lists = useQuery({
    queryKey: ['broadcast-lists'],
    queryFn: () => api.get<BroadcastListView[]>('/broadcasts/lists'),
  });

  const createList = useMutation({
    mutationFn: () => api.post('/broadcasts/lists', { name: name.trim(), memberCompanyIds: [] }),
    onSuccess: () => {
      setListOpen(false);
      setName('');
      void queryClient.invalidateQueries({ queryKey: ['broadcast-lists'] });
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Broadcast"
        action={
          <button className="text-sm font-medium text-accent" onClick={() => navigate('/broadcast/new')}>
            Compose
          </button>
        }
      />

      <Card className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">Send to many at once</p>
          <p className="text-xs text-muted">Reach selected buyers or a saved list.</p>
        </div>
        <Button onClick={() => navigate('/broadcast/new')}>New</Button>
      </Card>

      <section className="flex flex-col gap-2">
        <SectionHeader
          title="Saved lists"
          action={
            <button className="text-xs font-medium text-accent" onClick={() => setListOpen(true)}>
              Add list
            </button>
          }
        />
        {lists.isLoading ? (
          <LoadingBlock />
        ) : lists.data && lists.data.length > 0 ? (
          lists.data.map((list) => (
            <Card key={list.id} className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">{list.name}</p>
              <span className="text-xs text-muted">{list.memberCount} businesses</span>
            </Card>
          ))
        ) : (
          <EmptyState title="No saved lists" message="Group buyers into a list to broadcast faster." />
        )}
      </section>

      <Sheet open={listOpen} onClose={() => setListOpen(false)} title="New broadcast list">
        <div className="flex flex-col gap-3">
          <Field label="List name">
            <TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="Loyal retailers" />
          </Field>
          <Button fullWidth disabled={!name.trim() || createList.isPending} onClick={() => createList.mutate()}>
            Create list
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
