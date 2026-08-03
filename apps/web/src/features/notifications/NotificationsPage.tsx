import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CursorPage, NotificationPreferencesView, NotificationView } from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { timeAgo } from '@/lib/format';
import { enablePush, pushSupported } from '@/lib/push';
import { PageHeader } from '@/ui/PageHeader';
import { Button, Card, EmptyState, LoadingBlock, Sheet } from '@/ui/kit';

function link(item: NotificationView): string {
  switch (item.refType) {
    case 'order':
      return `/orders/${item.refId}`;
    case 'thread':
      return `/chats/${item.refId}`;
    case 'company':
      return `/company/${item.refId}`;
    case 'return':
      return `/orders`;
    default:
      return '/notifications';
  }
}

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  const feed = useQuery({
    queryKey: ['notifications', 'feed'],
    queryFn: () => api.get<CursorPage<NotificationView>>('/notifications', { limit: 40 }),
  });
  const prefs = useQuery({
    queryKey: ['notifications', 'preferences'],
    queryFn: () => api.get<NotificationPreferencesView>('/notifications/preferences'),
  });

  const markAll = useMutation({
    mutationFn: () => api.post('/notifications/read', {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const setPref = useMutation({
    mutationFn: (pushEnabled: boolean) =>
      api.put<NotificationPreferencesView>('/notifications/preferences', { pushEnabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', 'preferences'] }),
  });

  const turnOnPush = async () => {
    setPushBusy(true);
    try {
      const ok = await enablePush();
      if (ok) {
        setPref.mutate(true);
      }
    } finally {
      setPushBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Notifications"
        action={
          <button className="text-sm font-medium text-accent" onClick={() => setPrefsOpen(true)}>
            Settings
          </button>
        }
      />

      <div className="flex justify-end">
        <Button variant="ghost" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
          Mark all read
        </Button>
      </div>

      {feed.isLoading ? (
        <LoadingBlock />
      ) : feed.data && feed.data.results.length > 0 ? (
        <div className="flex flex-col gap-1">
          {feed.data.results.map((item) => (
            <Link
              key={item.id}
              to={link(item)}
              className="flex items-start gap-2 rounded-xl px-2 py-2.5 hover:bg-foam"
            >
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.read ? 'bg-transparent' : 'bg-accent'}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{item.title}</p>
                {item.body ? <p className="text-xs text-muted">{item.body}</p> : null}
              </div>
              <span className="text-xs text-muted">{timeAgo(item.createdAt)}</span>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="Nothing yet" message="Order updates, messages and requests land here." />
      )}

      <Sheet open={prefsOpen} onClose={() => setPrefsOpen(false)} title="Notification settings">
        <div className="flex flex-col gap-3">
          <Card className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">Push notifications</p>
              <p className="text-xs text-muted">
                {pushSupported() ? 'Get alerts even when Ekum is closed.' : 'Not supported on this device.'}
              </p>
            </div>
            {prefs.data?.pushEnabled ? (
              <Button variant="secondary" onClick={() => setPref.mutate(false)}>
                Turn off
              </Button>
            ) : (
              <Button disabled={!pushSupported() || pushBusy} onClick={() => void turnOnPush()}>
                {pushBusy ? 'Enabling…' : 'Turn on'}
              </Button>
            )}
          </Card>
        </div>
      </Sheet>
    </div>
  );
}
