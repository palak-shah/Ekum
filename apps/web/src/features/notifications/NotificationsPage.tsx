import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CursorPage, NotificationPreferencesView, NotificationView } from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { timeAgo } from '@/lib/format';
import { enablePush, pushSupported } from '@/lib/push';
import { PageHeader } from '@/ui/PageHeader';
import { Button, Card, EmptyState, LoadingBlock, Sheet } from '@/ui/kit';
import { openNotificationItem } from './openNotificationItem';

export function NotificationsPage() {
  const navigate = useNavigate();
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

  const invalidateFeed = () => {
    void queryClient.invalidateQueries({ queryKey: ['notifications', 'feed'] });
    void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
  };

  const markAll = useMutation({
    mutationFn: () => api.post('/notifications/read', {}),
    onSuccess: invalidateFeed,
  });

  const clearRead = useMutation({
    mutationFn: () => api.del('/notifications/read'),
    onSuccess: invalidateFeed,
  });

  const clearAll = useMutation({
    mutationFn: () => api.del('/notifications'),
    onSuccess: invalidateFeed,
  });

  const deleteOne = useMutation({
    mutationFn: (id: string) => api.del(`/notifications/${id}`),
    onSuccess: invalidateFeed,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`, {}),
    onSuccess: invalidateFeed,
  });

  const setPref = useMutation({
    mutationFn: (pushEnabled: boolean) =>
      api.put<NotificationPreferencesView>('/notifications/preferences', { pushEnabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', 'preferences'] }),
  });

  const openItem = async (item: NotificationView) => {
    await openNotificationItem({
      item,
      markRead: (id) => markRead.mutateAsync(id),
      navigate,
    });
  };

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

  const items = feed.data?.results ?? [];
  const hasRead = items.some((item) => item.read);
  const hasAny = items.length > 0;

  const confirmClearAll = () => {
    if (!window.confirm('Clear all notifications? This cannot be undone.')) return;
    clearAll.mutate();
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

      {hasAny ? (
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
          <button
            type="button"
            data-testid="notifications-mark-all-read"
            className="text-xs font-bold tracking-tight text-accent disabled:opacity-50"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
          >
            Mark all read
          </button>
          {hasRead ? (
            <button
              type="button"
              className="text-xs font-bold tracking-tight text-accent disabled:opacity-50"
              onClick={() => clearRead.mutate()}
              disabled={clearRead.isPending}
            >
              Clear read
            </button>
          ) : null}
          <button
            type="button"
            className="text-xs font-bold tracking-tight text-danger disabled:opacity-50"
            onClick={confirmClearAll}
            disabled={clearAll.isPending}
          >
            Clear all
          </button>
        </div>
      ) : null}

      {feed.isLoading ? (
        <LoadingBlock />
      ) : hasAny ? (
        <div className="flex flex-col gap-1">
          {items.map((item) => (
            <div
              key={item.id}
              data-testid="notification-item"
              className="flex items-start gap-1 rounded-xl px-1 py-2.5 hover:bg-foam"
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 items-start gap-2 px-1 text-left"
                onClick={() => void openItem(item)}
              >
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.read ? 'bg-transparent' : 'bg-accent'}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  {item.body ? <p className="text-xs text-muted">{item.body}</p> : null}
                </div>
                <span className="shrink-0 text-xs text-muted">{timeAgo(item.createdAt)}</span>
              </button>
              <button
                type="button"
                data-testid="notification-delete"
                aria-label="Delete notification"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg leading-none text-muted hover:bg-surface hover:text-ink"
                onClick={() => deleteOne.mutate(item.id)}
                disabled={deleteOne.isPending}
              >
                ×
              </button>
            </div>
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
