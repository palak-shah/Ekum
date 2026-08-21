import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  agreementStepLabel,
  buildOrderTimelineSteps,
  nextOrderAction,
  shortOrderLabel,
  type CreateReturnDto,
  type DecideOrderLinesDto,
  type DispatchDto,
  type OrderView,
  type QuoteOrderDto,
  type ReturnView,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useCompanyId } from '@/lib/auth';
import { formatDate, formatRate } from '@/lib/format';
import { returnStatusLabel } from '@/lib/status';
import { PageHeader } from '@/ui/PageHeader';
import { useToast } from '@/ui/Toast';
import {
  Button,
  Card,
  ErrorState,
  Field,
  InlineNotice,
  LoadingBlock,
  Sheet,
  StatusPill,
  TextArea,
  TextInput,
  cx,
} from '@/ui/kit';

function actionErrorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}
function OrderTimeline({ order }: { order: OrderView }) {
  const steps = buildOrderTimelineSteps({
    ...order,
    returns: order.returns ?? [],
  });
  const amended =
    order.amendCount > 0 ||
    (order.status === 'requested' &&
      new Date(order.updatedAt).getTime() - new Date(order.createdAt).getTime() > 2000);

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
              {step.detail ? <p className="text-xs text-muted">{step.detail}</p> : null}
              {step.key === 'requested' && amended ? (
                <p className="text-xs text-muted">
                  Updated
                  {order.amendCount > 1 ? ` · ${order.amendCount} times` : ''} ·{' '}
                  {formatDate(order.updatedAt)}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function lineStatusLabel(status: string): string {
  switch (status) {
    case 'declined':
      return 'Can’t supply';
    case 'confirmed':
      return 'Confirmed';
    case 'dispatched':
      return 'Dispatched';
    case 'delivered':
      return 'Delivered';
    default:
      return 'Open';
  }
}

export function OrderDetailPage() {
  const { id = '' } = useParams();
  const companyId = useCompanyId();
  const [searchParams] = useSearchParams();
  const focusReturnId = searchParams.get('return');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [linesOpen, setLinesOpen] = useState(false);
  const [amendOpen, setAmendOpen] = useState(false);
  const [amendQty, setAmendQty] = useState<Record<string, string>>({});
  const [amendRemoved, setAmendRemoved] = useState<Set<string>>(() => new Set());
  const [dispatch, setDispatch] = useState<{
    transporter?: string;
    lrNumber?: string;
    parcelCount?: number;
  }>({});
  const [shipQty, setShipQty] = useState<Record<string, string>>({});
  const [returnReason, setReturnReason] = useState('');
  const [returnSelected, setReturnSelected] = useState<Record<string, boolean>>({});
  const [returnQty, setReturnQty] = useState<Record<string, string>>({});
  const [quoteNote, setQuoteNote] = useState('');
  const [rates, setRates] = useState<Record<string, string>>({});
  const [offerQty, setOfferQty] = useState<Record<string, string>>({});
  const [unavailable, setUnavailable] = useState<Record<string, boolean>>({});
  const [lineActions, setLineActions] = useState<Record<string, 'confirm' | 'decline'>>({});
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [lrTouched, setLrTouched] = useState(false);

  const order = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get<OrderView>(`/orders/${id}`),
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['order', id] });
    void queryClient.invalidateQueries({ queryKey: ['orders'] });
    void queryClient.invalidateQueries({ queryKey: ['returns'] });
  };

  const act = useMutation({
    mutationFn: (action: string) => api.post<OrderView>(`/orders/${id}/${action}`, {}),
    onSuccess: refresh,
    onError: (err) => showToast(actionErrorMessage(err, 'Action failed.'), 'danger'),
  });

  const takeControl = useMutation({
    mutationFn: () =>
      api.post<{ downstream: OrderView; upstream: OrderView; cancelledOrderId: string }>(
        `/orders/${id}/take-control`,
        {},
      ),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      showToast('You took control of this order.');
      navigate(`/orders/${result.downstream.id}`, { replace: true });
    },
    onError: (err) => showToast(actionErrorMessage(err, 'Could not take control.'), 'danger'),
  });

  const openAmendSheet = () => {
    const items = order.data?.items ?? [];
    const qty: Record<string, string> = {};
    for (const item of items) {
      if (item.productId) qty[item.productId] = String(item.quantity);
    }
    setAmendQty(qty);
    setAmendRemoved(new Set());
    setSheetError(null);
    setAmendOpen(true);
  };

  const amendOrder = useMutation({
    mutationFn: () => {
      const items = (order.data?.items ?? [])
        .filter((item) => item.productId && !amendRemoved.has(item.productId))
        .map((item) => ({
          productId: item.productId!,
          quantity: Number(amendQty[item.productId!] || item.quantity),
          images: [] as string[],
        }))
        .filter((line) => line.quantity > 0);
      if (items.length < 1) {
        throw new ApiError({
          statusCode: 400,
          code: 'EMPTY_AMEND',
          message: 'Keep at least one design.',
        });
      }
      return api.post<OrderView>(`/orders/${id}/amend`, { items });
    },
    onSuccess: () => {
      setAmendOpen(false);
      setSheetError(null);
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      refresh();
    },
    onError: (err) => setSheetError(actionErrorMessage(err, 'Could not update.')),
  });

  const shippableItems = useMemo(
    () =>
      (order.data?.items ?? []).filter(
        (item) =>
          (item.lineStatus === 'confirmed' || item.lineStatus === 'dispatched') &&
          item.remainingQuantity > 0,
      ),
    [order.data?.items],
  );

  const dispatchOrder = useMutation({
    mutationFn: () => {
      const lrNumber = (dispatch.lrNumber ?? '').trim();
      if (!lrNumber) {
        throw new ApiError({
          statusCode: 400,
          code: 'LR_REQUIRED',
          message: 'Enter the LR number.',
        });
      }
      const items = shippableItems
        .map((item) => ({
          orderItemId: item.id,
          quantity: Number(shipQty[item.id] || item.remainingQuantity),
        }))
        .filter((line) => line.quantity > 0);
      if (items.length < 1) {
        throw new ApiError({
          statusCode: 400,
          code: 'NOTHING_TO_SHIP',
          message: 'Enter a quantity to ship on at least one line.',
        });
      }
      const dto: DispatchDto = {
        lrNumber,
        transporter: dispatch.transporter?.trim() || undefined,
        parcelCount: dispatch.parcelCount,
        items,
      };
      return api.post<OrderView>(`/orders/${id}/dispatch`, dto);
    },
    onSuccess: () => {
      setDispatchOpen(false);
      setDispatchError(null);
      setLrTouched(false);
      refresh();
    },
    onError: (err) =>
      setDispatchError(actionErrorMessage(err, 'Could not dispatch.')),
  });

  const submitDispatch = () => {
    setLrTouched(true);
    setDispatchError(null);
    const lrNumber = (dispatch.lrNumber ?? '').trim();
    if (!lrNumber) {
      setDispatchError('Enter the LR number.');
      return;
    }
    if (shippableItems.every((item) => Number(shipQty[item.id] || 0) <= 0)) {
      setDispatchError('Enter a quantity to ship on at least one line.');
      return;
    }
    dispatchOrder.mutate();
  };

  const sendQuote = useMutation({
    mutationFn: () => {
      const dto: QuoteOrderDto = {
        note: quoteNote || undefined,
        items: (order.data?.items ?? [])
          .filter((item) => item.lineStatus === 'open')
          .map((item) =>
            unavailable[item.id]
              ? { orderItemId: item.id, unavailable: true as const }
              : {
                  orderItemId: item.id,
                  rate: Number(rates[item.id] || item.rate || 0),
                  quantity: Number(offerQty[item.id] || item.quantity),
                },
          ),
      };
      return api.post<OrderView>(`/orders/${id}/quote`, dto);
    },
    onSuccess: (updated) => {
      setQuoteOpen(false);
      setSheetError(null);
      refresh();
      if (updated.threadId) {
        navigate(`/chats/${updated.threadId}`);
      }
    },
    onError: (err) => setSheetError(actionErrorMessage(err, 'Could not send quote.')),
  });

  const decideLines = useMutation({
    mutationFn: () => {
      const dto: DecideOrderLinesDto = {
        items: Object.entries(lineActions).map(([orderItemId, action]) => ({
          orderItemId,
          action,
        })),
      };
      return api.post<OrderView>(`/orders/${id}/lines/decide`, dto);
    },
    onSuccess: () => {
      setLinesOpen(false);
      setSheetError(null);
      refresh();
    },
    onError: (err) => setSheetError(actionErrorMessage(err, 'Could not update lines.')),
  });

  const raiseReturn = useMutation({
    mutationFn: () => {
      const items = (order.data?.items ?? [])
        .filter((item) => item.lineStatus !== 'declined' && returnSelected[item.id])
        .map((item) => ({
          orderItemId: item.id,
          quantity: Number(returnQty[item.id] || 0),
        }))
        .filter((line) => line.quantity > 0);
      if (items.length < 1) {
        throw new ApiError({
          statusCode: 400,
          code: 'EMPTY_RETURN',
          message: 'Select at least one design to return.',
        });
      }
      const dto: CreateReturnDto = {
        orderId: id,
        reason: returnReason || undefined,
        items,
      };
      return api.post('/returns', dto);
    },
    onSuccess: () => {
      setReturnOpen(false);
      setSheetError(null);
      refresh();
    },
    onError: (err) => setSheetError(actionErrorMessage(err, 'Could not raise return.')),
  });

  const returnAct = useMutation({
    mutationFn: ({
      returnId,
      action,
    }: {
      returnId: string;
      action: 'approve' | 'decline' | 'resolve';
    }) => {
      if (action === 'approve') {
        return api.post<ReturnView>(`/returns/${returnId}/approve`, {});
      }
      return api.post<ReturnView>(`/returns/${returnId}/${action}`);
    },
    onSuccess: () => refresh(),
    onError: (err) =>
      showToast(actionErrorMessage(err, 'Could not update return.'), 'danger'),
  });

  useEffect(() => {
    if (!focusReturnId || !order.data?.returns?.length) return;
    const node = document.getElementById(`return-${focusReturnId}`);
    node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusReturnId, order.data?.returns]);

  const openQuoteSheet = () => {
    const initialRates: Record<string, string> = {};
    const initialQty: Record<string, string> = {};
    const initialUnavail: Record<string, boolean> = {};
    for (const item of order.data?.items ?? []) {
      if (item.lineStatus !== 'open') continue;
      initialRates[item.id] = item.rate != null ? String(item.rate) : '';
      initialQty[item.id] = String(item.quantity);
      initialUnavail[item.id] = false;
    }
    setRates(initialRates);
    setOfferQty(initialQty);
    setUnavailable(initialUnavail);
    setQuoteNote('');
    setSheetError(null);
    setQuoteOpen(true);
  };

  const openLinesSheet = () => {
    const actions: Record<string, 'confirm' | 'decline'> = {};
    for (const item of order.data?.items ?? []) {
      if (item.lineStatus === 'open') actions[item.id] = 'confirm';
    }
    setLineActions(actions);
    setSheetError(null);
    setLinesOpen(true);
  };

  const openDispatchSheet = () => {
    const qty: Record<string, string> = {};
    for (const item of order.data?.items ?? []) {
      if (
        (item.lineStatus === 'confirmed' || item.lineStatus === 'dispatched') &&
        item.remainingQuantity > 0
      ) {
        qty[item.id] = String(item.remainingQuantity);
      }
    }
    setShipQty(qty);
    setDispatch({});
    setDispatchError(null);
    setLrTouched(false);
    setDispatchOpen(true);
  };

  const openReturnSheet = () => {
    const selected: Record<string, boolean> = {};
    const qty: Record<string, string> = {};
    for (const item of order.data?.items ?? []) {
      if (item.lineStatus === 'declined') continue;
      selected[item.id] = true;
      qty[item.id] = String(item.quantity);
    }
    setReturnSelected(selected);
    setReturnQty(qty);
    setSheetError(null);
    setReturnReason('');
    setReturnOpen(true);
  };

  const closeSheet = (which: 'quote' | 'lines' | 'dispatch' | 'amend' | 'return') => {
    setSheetError(null);
    if (which === 'quote') setQuoteOpen(false);
    if (which === 'lines') setLinesOpen(false);
    if (which === 'dispatch') {
      setDispatchError(null);
      setDispatchOpen(false);
    }
    if (which === 'amend') setAmendOpen(false);
    if (which === 'return') setReturnOpen(false);
  };

  const openItems = useMemo(
    () => (order.data?.items ?? []).filter((item) => item.lineStatus === 'open'),
    [order.data?.items],
  );

  const returnableItems = useMemo(
    () => (order.data?.items ?? []).filter((item) => item.lineStatus !== 'declined'),
    [order.data?.items],
  );

  const returnReady = useMemo(
    () =>
      returnableItems.some(
        (item) =>
          returnSelected[item.id] &&
          Number(returnQty[item.id] || 0) > 0 &&
          Number(returnQty[item.id] || 0) <= item.quantity,
      ),
    [returnableItems, returnSelected, returnQty],
  );

  const returnSelectedCount = useMemo(
    () => returnableItems.filter((item) => returnSelected[item.id]).length,
    [returnableItems, returnSelected],
  );

  const quoteReady = useMemo(() => {
    const supplyable = openItems.filter((item) => !unavailable[item.id]);
    return (
      supplyable.length > 0 &&
      supplyable.every((item) => {
        const rateOk = rates[item.id] !== '' && Number(rates[item.id]) >= 0;
        const qty = Number(offerQty[item.id] || 0);
        return rateOk && qty > 0 && qty <= item.requestedQuantity;
      })
    );
  }, [openItems, rates, offerQty, unavailable]);

  const quoteSummary = useMemo(() => {
    const supplyable = openItems.filter((item) => !unavailable[item.id]);
    const total = supplyable.reduce((sum, item) => {
      const rate = Number(rates[item.id] || 0);
      const qty = Number(offerQty[item.id] || item.quantity);
      return sum + rate * qty;
    }, 0);
    return { count: supplyable.length, total, of: openItems.length };
  }, [openItems, unavailable, rates, offerQty]);

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
  const hasRemaining = data.items.some((item) => item.remainingQuantity > 0);
  const nextCue = nextOrderAction({
    status: data.status,
    direction: data.direction === 'selling' ? 'selling' : 'buying',
    hasOpenQuotedLine: data.hasSellerQuote === true,
    partiallyShipped: data.partiallyShipped,
    intent: data.intent,
    counterpartName: data.counterpart.name,
  });
  const isInquiry = data.intent === 'inquiry';
  const idLabel = shortOrderLabel(data.id, { inquiry: isInquiry });
  const sharedByYou =
    data.tradeMode === 'direct' &&
    data.facilitatorCompanyId &&
    companyId === data.facilitatorCompanyId;
  const roleSubtitle = sharedByYou
    ? `Shared · ${data.sellerName}`
    : isInquiry
      ? data.direction === 'buying'
        ? `Inquiry to ${data.counterpart.name}`
        : `Inquiry from ${data.counterpart.name}`
      : data.direction === 'buying'
        ? `You buy from ${data.counterpart.name}`
        : `You sell to ${data.counterpart.name}`;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`${idLabel} · ${data.counterpart.name}`}
        subtitle={`${roleSubtitle} · ${data.kind}`}
        action={
          <div className="flex flex-col items-end gap-0.5">
            <StatusPill status={data.status} />
            {isInquiry ? (
              <span className="text-[10px] font-bold uppercase tracking-wide text-accent">
                Inquiry
              </span>
            ) : null}
            {data.partiallyShipped ? (
              <span className="text-[10px] font-bold uppercase tracking-wide text-accent">
                Part shipped
              </span>
            ) : null}
          </div>
        }
      />

      {nextCue ? (
        <p className="rounded-xl bg-foam px-3 py-2 text-sm font-medium text-ink">{nextCue}</p>
      ) : null}

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
        {data.tradeMode === 'direct' &&
        data.facilitatorCompanyId &&
        companyId === data.facilitatorCompanyId ? (
          <p className="pt-1 text-sm font-medium text-accent">Shared</p>
        ) : null}
        {data.status === 'confirmed' && (data.confirmedByName || data.confirmedByRole) ? (
          <p className="pt-1 text-muted">
            {agreementStepLabel(data.confirmedByRole, data.confirmedByName)}
          </p>
        ) : null}
      </Card>

      {data.relatedOrders && data.relatedOrders.length > 0 ? (
        <Card className="flex flex-col gap-2 text-sm">
          <p className="font-semibold text-ink">Related orders</p>
          {data.relatedOrders.map((related) => (
            <button
              key={related.id}
              type="button"
              className="flex flex-col items-start rounded-lg px-1 py-1 text-left hover:bg-foam"
              onClick={() => navigate(`/orders/${related.id}`)}
            >
              <span className="font-medium text-ink">
                {related.role === 'upstream' ? 'Upstream' : 'Downstream'} ·{' '}
                {shortOrderLabel(related.id)} · {related.status}
              </span>
              {(related.sellerName || related.buyerName) && (
                <span className="text-xs text-muted">
                  {[related.buyerName, related.sellerName].filter(Boolean).join(' → ')}
                </span>
              )}
            </button>
          ))}
        </Card>
      ) : null}

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
                {item.quantity}
                {item.requestedQuantity !== item.quantity
                  ? ` of ${item.requestedQuantity} asked`
                  : ''}{' '}
                × {formatRate(item.rate, item.unit)}
              </p>
              <p className="text-[11px] font-medium text-slate">
                {lineStatusLabel(item.lineStatus)}
                {item.shippedQuantity > 0
                  ? ` · shipped ${item.shippedQuantity}${item.remainingQuantity > 0 ? ` · left ${item.remainingQuantity}` : ''}`
                  : null}
              </p>
              {item.note ? <p className="text-xs text-muted">{item.note}</p> : null}
            </div>
          </div>
        ))}
        {data.note ? <p className="border-t border-line pt-2 text-sm text-muted">{data.note}</p> : null}
      </Card>

      <OrderTimeline order={data} />

      {(data.returns ?? []).length > 0 ? (
        <Card className="flex flex-col gap-3 text-sm">
          <p className="font-semibold text-ink">Returns</p>
          {(data.returns ?? []).map((ret) => {
            const focused = focusReturnId === ret.id;
            return (
              <div
                key={ret.id}
                id={`return-${ret.id}`}
                className={cx(
                  'border-t border-line pt-3 first:border-0 first:pt-0',
                  focused && 'rounded-xl bg-foam/80 px-2.5 py-2',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-ink">
                    {ret.items.length} {ret.items.length === 1 ? 'design' : 'designs'}
                    {ret.reason ? ` · ${ret.reason}` : ''}
                  </p>
                  <StatusPill status={ret.status} label={returnStatusLabel(ret.status)} />
                </div>
                <ul className="mt-2 flex flex-col gap-1">
                  {ret.items.map((line) => (
                    <li key={line.id} className="text-sm text-ink">
                      <span className="font-medium">{line.name}</span>
                      <span className="text-muted">
                        {' '}
                        · return {line.requestedQuantity}
                        {line.approvedQuantity != null
                          ? ` · approved ${line.approvedQuantity}`
                          : ''}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-1.5 text-xs text-muted">
                  Raised {formatDate(ret.createdAt)}
                </p>
                {isSeller && ret.status === 'requested' ? (
                  <div className="mt-2 flex flex-col gap-2">
                    <Button
                      onClick={() =>
                        returnAct.mutate({ returnId: ret.id, action: 'approve' })
                      }
                      disabled={returnAct.isPending}
                    >
                      Approve return
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        returnAct.mutate({ returnId: ret.id, action: 'decline' })
                      }
                      disabled={returnAct.isPending}
                    >
                      Decline return
                    </Button>
                  </div>
                ) : null}
                {isSeller &&
                (ret.status === 'approved' || ret.status === 'partially_approved') ? (
                  <Button
                    className="mt-2"
                    onClick={() =>
                      returnAct.mutate({ returnId: ret.id, action: 'resolve' })
                    }
                    disabled={returnAct.isPending}
                  >
                    Mark return resolved
                  </Button>
                ) : null}
              </div>
            );
          })}
        </Card>
      ) : null}

      {data.shipments.length > 0 ? (
        <Card className="flex flex-col gap-3 text-sm">
          <p className="font-semibold text-ink">Shipments</p>
          {data.shipments.map((shipment) => (
            <div key={shipment.id} className="border-t border-line pt-2 first:border-0 first:pt-0">
              <p className="font-medium text-ink">
                {shipment.lrNumber ? `LR · ${shipment.lrNumber}` : 'Dispatch'}
              </p>
              {shipment.transporter ? (
                <p className="text-muted">Transporter · {shipment.transporter}</p>
              ) : null}
              <p className="text-muted">
                {shipment.items.map((line) => `${line.name} × ${line.quantity}`).join(' · ')}
              </p>
              <p className="text-muted">Sent {formatDate(shipment.dispatchedAt)}</p>
            </div>
          ))}
        </Card>
      ) : null}

      <div className="flex flex-col gap-2">
        {data.threadId ? (
          <Button variant="secondary" onClick={() => navigate(`/chats/${data.threadId}`)}>
            Open chat
          </Button>
        ) : null}
        {isSeller && data.status === 'requested' ? (
          <>
            <Button onClick={openQuoteSheet}>Send quote</Button>
            <Button variant="secondary" onClick={openLinesSheet}>
              Confirm / decline lines
            </Button>
            <Button variant="secondary" onClick={() => act.mutate('confirm')} disabled={act.isPending}>
              Confirm all open
            </Button>
            <Button variant="secondary" onClick={() => act.mutate('decline')} disabled={act.isPending}>
              Decline order
            </Button>
          </>
        ) : null}
        {data.canTakeControl ? (
          <Button
            variant="secondary"
            onClick={() => takeControl.mutate()}
            disabled={takeControl.isPending}
          >
            Take over
          </Button>
        ) : null}
        {isBuyer && data.canAcceptQuote ? (
          <Button onClick={() => act.mutate('accept-quote')} disabled={act.isPending}>
            Accept quote
          </Button>
        ) : null}
        {isSeller && data.status === 'confirmed' && hasRemaining ? (
          <Button onClick={openDispatchSheet}>
            {data.partiallyShipped ? 'Dispatch remaining' : 'Dispatch shipment'}
          </Button>
        ) : null}
        {isBuyer && data.status === 'dispatched' ? (
          <Button onClick={() => act.mutate('deliver')} disabled={act.isPending}>
            Mark delivered
          </Button>
        ) : null}
        {isBuyer && data.canAmend ? (
          <Button variant="secondary" onClick={openAmendSheet}>
            {isInquiry ? 'Edit inquiry' : 'Edit order'}
          </Button>
        ) : null}
        {isBuyer && (data.status === 'requested' || data.status === 'confirmed') ? (
          <Button variant="secondary" onClick={() => act.mutate('cancel')} disabled={act.isPending}>
            {isInquiry && data.status === 'requested' ? 'Cancel inquiry' : 'Cancel order'}
          </Button>
        ) : null}
        {isBuyer && data.status === 'delivered' ? (
          <Button variant="secondary" onClick={openReturnSheet}>
            Raise a return
          </Button>
        ) : null}
        <Button variant="ghost" onClick={() => navigate(`/company/${data.counterpart.id}`)}>
          View {data.counterpart.name}
        </Button>
      </div>

      <Sheet open={quoteOpen} onClose={() => closeSheet('quote')} title="Send quote">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            Quoting {quoteSummary.count} of {quoteSummary.of} open · ₹
            {quoteSummary.total.toLocaleString('en-IN')}
          </p>
          {openItems.map((item) => (
            <div key={item.id} className="flex flex-col gap-2 rounded-xl border border-line p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-ink">{item.name}</p>
                <label className="flex items-center gap-1.5 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={Boolean(unavailable[item.id])}
                    onChange={(event) =>
                      setUnavailable((prev) => ({ ...prev, [item.id]: event.target.checked }))
                    }
                  />
                  Can’t supply
                </label>
              </div>
              {!unavailable[item.id] ? (
                <>
                  <Field label={`Offer qty (asked ${item.requestedQuantity})`}>
                    <TextInput
                      type="number"
                      min={1}
                      max={item.requestedQuantity}
                      value={offerQty[item.id] ?? ''}
                      onChange={(event) =>
                        setOfferQty((prev) => ({ ...prev, [item.id]: event.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Rate">
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
                </>
              ) : null}
            </div>
          ))}
          <Field label="Note (optional)">
            <TextArea value={quoteNote} onChange={(event) => setQuoteNote(event.target.value)} />
          </Field>
          {sheetError && quoteOpen ? <InlineNotice message={sheetError} /> : null}
          <Button
            fullWidth
            disabled={!quoteReady || sendQuote.isPending}
            onClick={() => sendQuote.mutate()}
          >
            {sendQuote.isPending ? 'Sending…' : 'Send quote in chat'}
          </Button>
        </div>
      </Sheet>

      <Sheet open={linesOpen} onClose={() => closeSheet('lines')} title="Confirm / decline lines">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">Decide each open design without sending rates.</p>
          {openItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-2">
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{item.name}</p>
              <div className="flex gap-1">
                <button
                  type="button"
                  className={cx(
                    'rounded-lg px-2.5 py-1 text-xs font-medium',
                    lineActions[item.id] === 'confirm'
                      ? 'bg-accent text-white'
                      : 'bg-foam text-muted',
                  )}
                  onClick={() => setLineActions((prev) => ({ ...prev, [item.id]: 'confirm' }))}
                >
                  Confirm
                </button>
                <button
                  type="button"
                  className={cx(
                    'rounded-lg px-2.5 py-1 text-xs font-medium',
                    lineActions[item.id] === 'decline'
                      ? 'bg-danger text-white'
                      : 'bg-foam text-muted',
                  )}
                  onClick={() => setLineActions((prev) => ({ ...prev, [item.id]: 'decline' }))}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
          {sheetError && linesOpen ? <InlineNotice message={sheetError} /> : null}
          <Button
            fullWidth
            disabled={openItems.length === 0 || decideLines.isPending}
            onClick={() => decideLines.mutate()}
          >
            {decideLines.isPending ? 'Saving…' : 'Save line decisions'}
          </Button>
        </div>
      </Sheet>

      <Sheet
        open={dispatchOpen}
        onClose={() => closeSheet('dispatch')}
        title="Dispatch"
        footer={
          <div className="flex flex-col gap-2.5">
            <Field
              label="LR number"
              error={
                lrTouched && !(dispatch.lrNumber ?? '').trim() ? 'LR number is required' : null
              }
            >
              <TextInput
                value={dispatch.lrNumber ?? ''}
                placeholder="Required"
                className={cx(
                  lrTouched && !(dispatch.lrNumber ?? '').trim() && 'border-danger focus:border-danger',
                )}
                onChange={(event) => {
                  setLrTouched(true);
                  setDispatch((prev) => ({ ...prev, lrNumber: event.target.value }));
                }}
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Transporter">
                <TextInput
                  value={dispatch.transporter ?? ''}
                  placeholder="Optional"
                  onChange={(event) =>
                    setDispatch((prev) => ({ ...prev, transporter: event.target.value }))
                  }
                />
              </Field>
              <Field label="Parcels">
                <TextInput
                  type="number"
                  min={1}
                  value={dispatch.parcelCount ?? ''}
                  placeholder="Optional"
                  onChange={(event) =>
                    setDispatch((prev) => ({
                      ...prev,
                      parcelCount: event.target.value ? Number(event.target.value) : undefined,
                    }))
                  }
                />
              </Field>
            </div>
            {dispatchError ? <InlineNotice message={dispatchError} /> : null}
            <Button fullWidth onClick={submitDispatch} disabled={dispatchOrder.isPending}>
              {dispatchOrder.isPending ? 'Saving…' : 'Confirm dispatch'}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">
            Ship all remaining, or lower qty per line. Logistics stay pinned below.
          </p>
          {shippableItems.length === 0 ? (
            <InlineNotice message="No confirmed quantity left to dispatch." />
          ) : (
            shippableItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 border-b border-line py-2 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                  <p className="text-[11px] text-muted">left {item.remainingQuantity}</p>
                </div>
                <TextInput
                  type="number"
                  min={0}
                  max={item.remainingQuantity}
                  className="w-20 shrink-0 min-h-10 px-2 text-center"
                  value={shipQty[item.id] ?? ''}
                  onChange={(event) =>
                    setShipQty((prev) => ({ ...prev, [item.id]: event.target.value }))
                  }
                />
              </div>
            ))
          )}
        </div>
      </Sheet>

      <Sheet
        open={amendOpen}
        onClose={() => closeSheet('amend')}
        title={isInquiry ? 'Edit inquiry' : 'Edit order'}
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            Change quantities or remove designs before they respond. Adds show in chat as Updated.
          </p>
          {(data.items ?? [])
            .filter((item) => item.productId)
            .map((item) => {
              const pid = item.productId!;
              const removed = amendRemoved.has(pid);
              return (
                <div
                  key={item.id}
                  className={cx(
                    'flex items-center gap-2 rounded-xl border border-line p-3',
                    removed && 'opacity-50',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                    {item.sku ? <p className="text-[11px] text-muted">{item.sku}</p> : null}
                  </div>
                  {!removed ? (
                    <TextInput
                      type="number"
                      min={1}
                      className="w-20 shrink-0 min-h-10 px-2 text-center"
                      value={amendQty[pid] ?? String(item.quantity)}
                      onChange={(event) =>
                        setAmendQty((prev) => ({ ...prev, [pid]: event.target.value }))
                      }
                    />
                  ) : null}
                  <button
                    type="button"
                    className="shrink-0 text-xs font-bold text-accent"
                    onClick={() =>
                      setAmendRemoved((prev) => {
                        const next = new Set(prev);
                        if (next.has(pid)) next.delete(pid);
                        else next.add(pid);
                        return next;
                      })
                    }
                  >
                    {removed ? 'Undo' : 'Remove'}
                  </button>
                </div>
              );
            })}
          <p className="text-xs text-muted">
            To add designs, open their collection, select more, and ask rates / order again — or keep
            editing quantities here.
          </p>
          {sheetError && amendOpen ? <InlineNotice message={sheetError} /> : null}
          <Button fullWidth onClick={() => amendOrder.mutate()} disabled={amendOrder.isPending}>
            {amendOrder.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </Sheet>

      <Sheet open={returnOpen} onClose={() => closeSheet('return')} title="Raise a return">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            {returnableItems.length > 0
              ? `${returnSelectedCount} of ${returnableItems.length} selected · leave all on for a full return`
              : 'Pick designs to return'}
          </p>
          {returnableItems.length === 0 ? (
            <InlineNotice message="No supplyable lines left to return." />
          ) : (
            returnableItems.map((item) => {
              const on = Boolean(returnSelected[item.id]);
              return (
                <div
                  key={item.id}
                  className={cx(
                    'flex items-center gap-2 rounded-xl border px-2.5 py-2',
                    on ? 'border-accent bg-accent/5' : 'border-line bg-surface',
                  )}
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    aria-pressed={on}
                    aria-label={on ? `Skip ${item.name}` : `Return ${item.name}`}
                    onClick={() => {
                      setSheetError(null);
                      setReturnSelected((prev) => ({
                        ...prev,
                        [item.id]: !prev[item.id],
                      }));
                    }}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-foam text-sm font-bold text-muted">
                        {item.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                      <p className="truncate text-xs text-muted">Ordered {item.quantity}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted">{on ? 'Return' : 'Skip'}</span>
                  </button>
                  <TextInput
                    type="number"
                    min={1}
                    max={item.quantity}
                    disabled={!on}
                    className="w-20 shrink-0 min-h-10 px-2 text-center"
                    value={returnQty[item.id] ?? ''}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => {
                      setSheetError(null);
                      setReturnQty((prev) => ({ ...prev, [item.id]: event.target.value }));
                    }}
                  />
                </div>
              );
            })
          )}
          <Field label="Reason (optional)">
            <TextArea
              value={returnReason}
              onChange={(event) => {
                setSheetError(null);
                setReturnReason(event.target.value);
              }}
            />
          </Field>
          {sheetError && returnOpen ? <InlineNotice message={sheetError} /> : null}
          <Button
            fullWidth
            onClick={() => raiseReturn.mutate()}
            disabled={!returnReady || raiseReturn.isPending}
          >
            {raiseReturn.isPending ? 'Submitting…' : 'Submit return'}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
