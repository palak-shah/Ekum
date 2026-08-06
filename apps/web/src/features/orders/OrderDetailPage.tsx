import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateReturnDto, DispatchDto, OrderView, QuoteOrderDto } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { formatDate, formatRate } from '@/lib/format';
import { PageHeader } from '@/ui/PageHeader';
import {
  Button,
  Card,
  ErrorState,
  Field,
  LoadingBlock,
  Sheet,
  StatusPill,
  TextArea,
  TextInput,
  cx,
} from '@/ui/kit';

function OrderTimeline({ order }: { order: OrderView }) {
  const steps = [
    {
      key: 'requested',
      label: 'Requested',
      at: order.createdAt,
      done: true,
      current: order.status === 'requested',
    },
    {
      key: 'confirmed',
      label: order.confirmedByName
        ? `Confirmed by ${order.confirmedByName}`
        : 'Confirmed',
      at: order.confirmedAt,
      done: Boolean(order.confirmedAt),
      current: order.status === 'confirmed',
    },
    {
      key: 'dispatched',
      label: 'Dispatched',
      at: order.dispatch?.dispatchedAt ?? null,
      done: Boolean(order.dispatch?.dispatchedAt),
      current: order.status === 'dispatched',
    },
    {
      key: 'delivered',
      label: 'Delivered',
      at: order.deliveredAt,
      done: Boolean(order.deliveredAt),
      current: order.status === 'delivered',
    },
  ];

  return (
    <Card className="flex flex-col gap-0">
      <p className="mb-3 text-sm font-semibold text-ink">Timeline</p>
      <ol className="flex flex-col">
        {steps.map((step, index) => (
          <li key={step.key} className="flex gap-3">
            <div className="flex w-4 flex-col items-center">
              <span
                className={cx(
                  'mt-1 h-2.5 w-2.5 shrink-0 rounded-full',
                  step.done || step.current ? 'bg-accent' : 'bg-line',
                )}
              />
              {index < steps.length - 1 ? (
                <span className={cx('my-1 w-px flex-1 min-h-4', step.done ? 'bg-accent/40' : 'bg-line')} />
              ) : null}
            </div>
            <div className={cx('min-w-0 pb-3', index === steps.length - 1 && 'pb-0')}>
              <p
                className={cx(
                  'text-sm font-medium',
                  step.done || step.current ? 'text-ink' : 'text-muted',
                )}
              >
                {step.label}
              </p>
              <p className="text-xs text-muted">{step.at ? formatDate(step.at) : '—'}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

export function OrderDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [dispatch, setDispatch] = useState<DispatchDto>({});
  const [returnReason, setReturnReason] = useState('');
  const [quoteNote, setQuoteNote] = useState('');
  const [rates, setRates] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const order = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get<OrderView>(`/orders/${id}`),
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['order', id] });
    void queryClient.invalidateQueries({ queryKey: ['orders'] });
  };

  const act = useMutation({
    mutationFn: (action: string) => api.post<OrderView>(`/orders/${id}/${action}`, {}),
    onSuccess: refresh,
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Action failed.'),
  });

  const dispatchOrder = useMutation({
    mutationFn: () => api.post<OrderView>(`/orders/${id}/dispatch`, dispatch),
    onSuccess: () => {
      setDispatchOpen(false);
      refresh();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not dispatch.'),
  });

  const sendQuote = useMutation({
    mutationFn: () => {
      const dto: QuoteOrderDto = {
        note: quoteNote || undefined,
        items: (order.data?.items ?? []).map((item) => ({
          orderItemId: item.id,
          rate: Number(rates[item.id] || item.rate || 0),
        })),
      };
      return api.post<OrderView>(`/orders/${id}/quote`, dto);
    },
    onSuccess: (updated) => {
      setQuoteOpen(false);
      refresh();
      if (updated.threadId) {
        navigate(`/chats/${updated.threadId}`);
      }
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not send quote.'),
  });

  const raiseReturn = useMutation({
    mutationFn: () => {
      const dto: CreateReturnDto = {
        orderId: id,
        reason: returnReason || undefined,
        items: (order.data?.items ?? []).map((item) => ({ orderItemId: item.id, quantity: item.quantity })),
      };
      return api.post('/returns', dto);
    },
    onSuccess: () => {
      setReturnOpen(false);
      refresh();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not raise return.'),
  });

  const openQuoteSheet = () => {
    const initial: Record<string, string> = {};
    for (const item of order.data?.items ?? []) {
      initial[item.id] = item.rate != null ? String(item.rate) : '';
    }
    setRates(initial);
    setQuoteNote('');
    setQuoteOpen(true);
  };

  const quoteReady = useMemo(() => {
    const items = order.data?.items ?? [];
    return items.length > 0 && items.every((item) => Number(rates[item.id]) >= 0 && rates[item.id] !== '');
  }, [order.data?.items, rates]);

  if (order.isLoading) {
    return <LoadingBlock label="Loading order…" />;
  }
  if (order.isError || !order.data) {
    return (
      <>
        <PageHeader title="Order" />
        <ErrorState message="This order isn't available." />
      </>
    );
  }

  const data = order.data;
  const isSeller = data.direction === 'selling';
  const isBuyer = data.direction === 'buying';

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`Order · ${data.counterpart.name}`}
        subtitle={`${data.direction === 'buying' ? 'Buying from' : 'Selling to'} · ${data.kind}`}
        action={<StatusPill status={data.status} />}
      />

      <Card className="flex flex-col gap-1 text-sm">
        <p className="font-semibold text-ink">Parties</p>
        <p className="text-muted">
          Buyer · <span className="font-medium text-ink">{data.buyerName}</span>
          {data.direction === 'buying' ? ' (you)' : ''}
        </p>
        <p className="text-muted">
          Seller · <span className="font-medium text-ink">{data.sellerName}</span>
          {data.direction === 'selling' ? ' (you)' : ''}
        </p>
        {data.status === 'confirmed' && data.confirmedByName ? (
          <p className="pt-1 text-muted">
            Confirmed by{' '}
            <span className="font-medium text-ink">{data.confirmedByName}</span>
          </p>
        ) : null}
      </Card>

      <Card className="flex flex-col gap-3">
        {data.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            {item.image ? (
              <img src={item.image} alt={item.name} className="h-14 w-14 rounded-xl object-cover" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-foam text-muted">
                {item.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{item.name}</p>
              <p className="text-xs text-muted">
                {item.quantity} × {formatRate(item.rate, item.unit)}
              </p>
              {item.note ? <p className="text-xs text-muted">{item.note}</p> : null}
            </div>
          </div>
        ))}
        {data.note ? <p className="border-t border-line pt-2 text-sm text-muted">{data.note}</p> : null}
      </Card>

      <OrderTimeline order={data} />

      {data.dispatch?.dispatchedAt ? (
        <Card className="flex flex-col gap-1 text-sm">
          <p className="font-semibold text-ink">Dispatch</p>
          {data.dispatch.transporter ? <p className="text-muted">Transporter · {data.dispatch.transporter}</p> : null}
          {data.dispatch.lrNumber ? <p className="text-muted">LR · {data.dispatch.lrNumber}</p> : null}
          {data.dispatch.parcelCount ? <p className="text-muted">{data.dispatch.parcelCount} parcels</p> : null}
          <p className="text-muted">Sent {formatDate(data.dispatch.dispatchedAt)}</p>
        </Card>
      ) : null}

      {error ? <p className="text-center text-xs text-danger">{error}</p> : null}

      <div className="flex flex-col gap-2">
        {data.threadId ? (
          <Button variant="secondary" onClick={() => navigate(`/chats/${data.threadId}`)}>
            Open chat
          </Button>
        ) : null}
        {isSeller && data.status === 'requested' ? (
          <>
            <Button onClick={openQuoteSheet}>Send quote</Button>
            <Button variant="secondary" onClick={() => act.mutate('confirm')} disabled={act.isPending}>
              Confirm order
            </Button>
            <Button variant="secondary" onClick={() => act.mutate('decline')} disabled={act.isPending}>
              Decline
            </Button>
          </>
        ) : null}
        {isBuyer && data.status === 'requested' && data.items.some((item) => item.rate != null) ? (
          <Button onClick={() => act.mutate('accept-quote')} disabled={act.isPending}>
            Accept quote
          </Button>
        ) : null}
        {isSeller && data.status === 'confirmed' ? (
          <Button onClick={() => setDispatchOpen(true)}>Mark dispatched</Button>
        ) : null}
        {isBuyer && data.status === 'dispatched' ? (
          <Button onClick={() => act.mutate('deliver')} disabled={act.isPending}>
            Mark delivered
          </Button>
        ) : null}
        {isBuyer && (data.status === 'requested' || data.status === 'confirmed') ? (
          <Button variant="secondary" onClick={() => act.mutate('cancel')} disabled={act.isPending}>
            Cancel order
          </Button>
        ) : null}
        {isBuyer && data.status === 'delivered' ? (
          <Button variant="secondary" onClick={() => setReturnOpen(true)}>
            Raise a return
          </Button>
        ) : null}
        <Button variant="ghost" onClick={() => navigate(`/company/${data.counterpart.id}`)}>
          View {data.counterpart.name}
        </Button>
      </div>

      <Sheet open={quoteOpen} onClose={() => setQuoteOpen(false)} title="Send quote">
        <div className="flex flex-col gap-3">
          {data.items.map((item) => (
            <Field key={item.id} label={`${item.name} · qty ${item.quantity}`}>
              <TextInput
                type="number"
                min={0}
                placeholder="Rate"
                value={rates[item.id] ?? ''}
                onChange={(event) =>
                  setRates((prev) => ({ ...prev, [item.id]: event.target.value }))
                }
              />
            </Field>
          ))}
          <Field label="Note (optional)">
            <TextArea value={quoteNote} onChange={(event) => setQuoteNote(event.target.value)} />
          </Field>
          <Button
            fullWidth
            disabled={!quoteReady || sendQuote.isPending}
            onClick={() => sendQuote.mutate()}
          >
            {sendQuote.isPending ? 'Sending…' : 'Send quote in chat'}
          </Button>
        </div>
      </Sheet>

      <Sheet open={dispatchOpen} onClose={() => setDispatchOpen(false)} title="Dispatch details">
        <div className="flex flex-col gap-3">
          <Field label="Transporter">
            <TextInput
              value={dispatch.transporter ?? ''}
              onChange={(event) => setDispatch((prev) => ({ ...prev, transporter: event.target.value }))}
            />
          </Field>
          <Field label="LR number">
            <TextInput
              value={dispatch.lrNumber ?? ''}
              onChange={(event) => setDispatch((prev) => ({ ...prev, lrNumber: event.target.value }))}
            />
          </Field>
          <Field label="Parcel count">
            <TextInput
              type="number"
              value={dispatch.parcelCount ?? ''}
              onChange={(event) =>
                setDispatch((prev) => ({
                  ...prev,
                  parcelCount: event.target.value ? Number(event.target.value) : undefined,
                }))
              }
            />
          </Field>
          <Button fullWidth onClick={() => dispatchOrder.mutate()} disabled={dispatchOrder.isPending}>
            {dispatchOrder.isPending ? 'Saving…' : 'Confirm dispatch'}
          </Button>
        </div>
      </Sheet>

      <Sheet open={returnOpen} onClose={() => setReturnOpen(false)} title="Raise a return">
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted">This requests a return for all items on the order.</p>
          <Field label="Reason">
            <TextArea value={returnReason} onChange={(event) => setReturnReason(event.target.value)} />
          </Field>
          <Button fullWidth onClick={() => raiseReturn.mutate()} disabled={raiseReturn.isPending}>
            {raiseReturn.isPending ? 'Submitting…' : 'Submit return'}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
