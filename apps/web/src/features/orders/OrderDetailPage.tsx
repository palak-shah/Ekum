import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  agreementStepLabel,
  buildOrderTimelineSteps,
  shortOrderLabel,
  suggestedPaymentAmount,
  type CreatePaymentRequestDto,
  type CreateReturnDto,
  type DecideOrderLinesDto,
  type DispatchDto,
  type OrderItemView,
  type OrderView,
  type QuoteOrderDto,
  type ReturnView,
  type SendUpOrderDto,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { auditLine } from '@/features/catalog/productStatusSummary';
import {
  galleryIndexForItem,
  orderItemGalleryUrls,
  urlsForOrderItem,
} from '@/features/orders/orderItemImages';
import { useCompanyId } from '@/lib/auth';
import { formatDate, formatRate, formatUnit } from '@/lib/format';
import { returnStatusLabel } from '@/lib/status';
import { PageHeader } from '@/ui/PageHeader';
import { PhotoViewer } from '@/ui/PhotoViewer';
import { useToast } from '@/ui/Toast';
import { NoteVoiceField, type NoteVoiceValue } from '@/features/voice/NoteVoiceField';
import { VoicePlayer } from '@/features/voice/VoicePlayer';
import {
  itemsForMill,
  millCue,
  millFromToCells,
  millLineForParent,
  millsObserveMode,
  orderDetailBehindTakeOver,
  orderDetailNextCue,
  orderDetailTakeOverHasWork,
  orderTicketMillLabel,
  orderTicketMillNames,
  quotePrefillFromMills,
  showMillSendOnCard,
  showSellerConfirmOnDesk,
  showSendQuoteOnDeskFace,
} from '@/features/orders/iHandleDesk';
import {
  allReturnLinesSelected,
  clearReturnSelection,
  selectAllReturnLines,
} from '@/features/orders/returnRaiseSelect';
import { ratesWithSharedValue } from '@/features/orders/quoteSameRate';
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
import { COMPACT_QTY_INPUT_CLASS, COMPACT_SHEET_NUM_INPUT_CLASS } from '@/ui/mobileOverflow';

function RateFigure({
  amount,
  unit,
  qtyPrefix,
  muted,
}: {
  amount: string;
  unit: string;
  qtyPrefix?: string;
  muted?: boolean;
}) {
  return (
    <p
      className={cx(
        'text-center tabular-nums leading-tight',
        muted ? 'text-muted' : 'text-ink',
      )}
    >
      {qtyPrefix ? (
        <span className="text-[10px] font-medium text-muted">{qtyPrefix}</span>
      ) : null}
      <span className="text-sm font-semibold">{amount}</span>
      {unit ? (
        <span className="text-[10px] font-normal text-muted">{unit}</span>
      ) : null}
    </p>
  );
}

function rateAmount(rate: number | null): string {
  if (rate == null) return '—';
  return `₹${rate.toLocaleString('en-IN')}`;
}

function rateUnitSuffix(unit: string | null): string {
  const label = formatUnit(unit);
  return label ? `/${label}` : '';
}

function actionErrorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

function OrderTimeline({ order }: { order: OrderView }) {
  const trail = order.trail ?? [];
  if (trail.length > 0) {
    return (
      <Card className="flex flex-col gap-0">
        <p className="mb-3 text-sm font-semibold text-ink">Timeline</p>
        <ol className="flex flex-col">
          {trail.map((step, index) => (
            <li key={step.id} className="flex gap-3">
              <div className="flex w-4 flex-col items-center">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
                {index < trail.length - 1 ? (
                  <span className="my-1 min-h-4 w-px flex-1 bg-accent/40" />
                ) : null}
              </div>
              <div className={cx('min-w-0 pb-3', index === trail.length - 1 && 'pb-0')}>
                <p className="text-sm font-medium text-ink">{step.summary ?? step.type}</p>
                <p className="text-xs text-muted">{formatDate(step.at)}</p>
                {step.who ? <p className="text-[11px] text-muted">{step.who}</p> : null}
                {step.detail ? <p className="text-xs text-muted">{step.detail}</p> : null}
                {step.note ? (
                  <p className="mt-0.5 whitespace-pre-wrap text-xs text-muted">{step.note}</p>
                ) : null}
                {step.noteVoiceUrl ? (
                  <div className="mt-1">
                    <VoicePlayer
                      src={step.noteVoiceUrl}
                      durationMs={step.noteVoiceDurationMs}
                    />
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </Card>
    );
  }

  const steps = buildOrderTimelineSteps({
    ...order,
    returns: order.returns ?? [],
    staff: order.timelineStaff,
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
              {step.staffLine ? (
                <p className="text-[11px] text-muted">{step.staffLine}</p>
              ) : null}
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

function OrderLinePhoto({
  item,
  items,
  onOpen,
  size = 'md',
}: {
  item: OrderItemView;
  items: OrderItemView[];
  onOpen: (index: number) => void;
  size?: 'md' | 'sm';
}) {
  const url = urlsForOrderItem(item)[0];
  const dim = size === 'sm' ? 'h-12 w-12 rounded-lg' : 'h-14 w-14 rounded-xl';
  if (!url) {
    return (
      <div
        className={cx(
          'flex shrink-0 items-center justify-center bg-foam text-muted',
          dim,
          size === 'sm' && 'text-sm font-bold',
        )}
      >
        {item.name.charAt(0)}
      </div>
    );
  }
  return (
    <button
      type="button"
      className="shrink-0"
      aria-label={`View photo for ${item.name}`}
      onClick={(event) => {
        event.stopPropagation();
        onOpen(galleryIndexForItem(items, item.id));
      }}
    >
      <img src={url} alt="" className={cx(dim, 'object-cover')} />
    </button>
  );
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
  const [settleOpen, setSettleOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [linesOpen, setLinesOpen] = useState(false);
  const [amendOpen, setAmendOpen] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [payHow, setPayHow] = useState('');
  const [payError, setPayError] = useState<string | null>(null);
  const [changeQty, setChangeQty] = useState<Record<string, string>>({});
  const [changeRate, setChangeRate] = useState<Record<string, string>>({});
  const [amendQty, setAmendQty] = useState<Record<string, string>>({});
  const [amendRemoved, setAmendRemoved] = useState<Set<string>>(() => new Set());
  const [dispatch, setDispatch] = useState<{
    transporter?: string;
    lrNumber?: string;
    parcelCount?: number;
  }>({});
  const [shipQty, setShipQty] = useState<Record<string, string>>({});
  const [returnReason, setReturnReason] = useState('');
  const [returnReasonVoice, setReturnReasonVoice] = useState<NoteVoiceValue>(null);
  const [returnSelected, setReturnSelected] = useState<Record<string, boolean>>({});
  const [returnQty, setReturnQty] = useState<Record<string, string>>({});
  const [dispatchNote, setDispatchNote] = useState('');
  const [dispatchNoteVoice, setDispatchNoteVoice] = useState<NoteVoiceValue>(null);
  const [amendNote, setAmendNote] = useState('');
  const [amendNoteVoice, setAmendNoteVoice] = useState<NoteVoiceValue>(null);
  const [linesNote, setLinesNote] = useState('');
  const [linesNoteVoice, setLinesNoteVoice] = useState<NoteVoiceValue>(null);
  const [payNoteVoice, setPayNoteVoice] = useState<NoteVoiceValue>(null);
  const [actionNoteOpen, setActionNoteOpen] = useState<'cancel' | 'decline' | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [actionNoteVoice, setActionNoteVoice] = useState<NoteVoiceValue>(null);
  const [quoteNote, setQuoteNote] = useState('');
  const [quoteNoteVoice, setQuoteNoteVoice] = useState<NoteVoiceValue>(null);
  const [quoteVoiceBusy, setQuoteVoiceBusy] = useState(false);
  const [settleNote, setSettleNote] = useState('');
  const [settleNoteVoice, setSettleNoteVoice] = useState<NoteVoiceValue>(null);
  const [rates, setRates] = useState<Record<string, string>>({});
  const [offerQty, setOfferQty] = useState<Record<string, string>>({});
  const [unavailable, setUnavailable] = useState<Record<string, boolean>>({});
  const [sharedQuoteRate, setSharedQuoteRate] = useState('');
  const [sharedMillRate, setSharedMillRate] = useState('');
  const [quoteRateDefaults, setQuoteRateDefaults] = useState<Record<string, string>>({});
  const [millRateDefaults, setMillRateDefaults] = useState<Record<string, string>>({});
  const [lineActions, setLineActions] = useState<Record<string, 'confirm' | 'decline'>>({});
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [lrTouched, setLrTouched] = useState(false);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoViewerIndex, setPhotoViewerIndex] = useState(0);
  const [takeOverOpen, setTakeOverOpen] = useState(false);

  const order = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get<OrderView>(`/orders/${id}`),
  });

  useEffect(() => {
    const desk = order.data?.deskOrderId;
    if (!desk || desk === id) return;
    navigate(`/orders/${desk}`, { replace: true });
  }, [order.data?.deskOrderId, id, navigate]);

  useEffect(() => {
    if (order.data?.direction !== 'buying') return;
    for (const ask of order.data.paymentRequests ?? []) {
      if (ask.status === 'open' && !ask.seenAt) {
        void api.post(`/payment-requests/${ask.id}/seen`, {}).then(() => {
          void queryClient.invalidateQueries({ queryKey: ['order', id] });
        });
      }
    }
  }, [order.data, id, queryClient]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['order', id] });
    void queryClient.invalidateQueries({ queryKey: ['orders'] });
    void queryClient.invalidateQueries({ queryKey: ['returns'] });
    void queryClient.invalidateQueries({ queryKey: ['threads'] });
    const threadId = order.data?.threadId;
    if (threadId) {
      void queryClient.invalidateQueries({ queryKey: ['thread', threadId, 'messages'] });
    }
  };

  const act = useMutation({
    mutationFn: (action: string) => api.post<OrderView>(`/orders/${id}/${action}`, {}),
    onSuccess: refresh,
    onError: (err) => showToast(actionErrorMessage(err, 'Action failed.'), 'danger'),
  });

  const actionWithNote = useMutation({
    mutationFn: () => {
      const action = actionNoteOpen;
      if (!action) throw new Error('No action');
      return api.post<OrderView>(`/orders/${id}/${action}`, {
        note: actionNote.trim() || undefined,
        noteVoiceMediaId: actionNoteVoice?.mediaId,
        noteVoiceDurationMs: actionNoteVoice?.durationMs,
      });
    },
    onSuccess: () => {
      setActionNoteOpen(null);
      setActionNote('');
      setActionNoteVoice(null);
      refresh();
    },
    onError: (err) => showToast(actionErrorMessage(err, 'Action failed.'), 'danger'),
  });

  const sendUp = useMutation({
    mutationFn: (body: SendUpOrderDto) => api.post<OrderView>(`/orders/${id}/send-up`, body),
    onSuccess: () => {
      setChangeOpen(false);
      refresh();
      showToast('Sent.');
    },
    onError: (err) => showToast(actionErrorMessage(err, 'Could not send.'), 'danger'),
  });

  const millHold = useMutation({
    mutationFn: (body: { upstreamOrderId: string; held: boolean }) =>
      api.post<OrderView>(`/orders/${id}/mill-hold`, body),
    onSuccess: refresh,
    onError: (err) => showToast(actionErrorMessage(err, 'Could not update.'), 'danger'),
  });

  const millReveal = useMutation({
    mutationFn: (body: { upstreamOrderId: string; reveal: boolean }) =>
      api.post<OrderView>(`/orders/${id}/mill-reveal`, body),
    onSuccess: refresh,
    onError: (err) => showToast(actionErrorMessage(err, 'Could not update.'), 'danger'),
  });

  const flipTicket = useMutation({
    mutationFn: (body: { ticket: 'me' | 'mill'; upstreamOrderId?: string }) =>
      api.post<OrderView>(`/orders/${id}/ticket`, body),
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      if (view.id !== id) {
        navigate(`/orders/${view.id}`, { replace: true });
        return;
      }
      refresh();
    },
    onError: (err) => showToast(actionErrorMessage(err, 'Could not update.'), 'danger'),
  });

  const [millQty, setMillQty] = useState<Record<string, string>>({});
  const [millRate, setMillRate] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!order.data) return;
    const qty: Record<string, string> = {};
    const rate: Record<string, string> = {};
    for (const item of order.data.items) {
      qty[item.id] = String(item.quantity);
      rate[item.id] = item.rate != null ? String(item.rate) : '';
    }
    setMillQty(qty);
    setMillRate(rate);
    setMillRateDefaults(rate);
    setSharedMillRate('');
  }, [order.data]);

  const takeControl = useMutation({
    mutationFn: () =>
      api.post<{ downstream: OrderView; upstream: OrderView; cancelledOrderId: string }>(
        `/orders/${id}/take-control`,
        {},
      ),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      showToast('You’re handling this order yourself.');
      navigate(`/orders/${result.downstream.id}`, { replace: true });
    },
    onError: (err) => showToast(actionErrorMessage(err, 'Could not switch to handle yourself.'), 'danger'),
  });

  const askPay = useMutation({
    mutationFn: () => {
      const amount = Number(payAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new ApiError({
          statusCode: 400,
          code: 'AMOUNT_REQUIRED',
          message: 'Enter an amount.',
        });
      }
      const dto: CreatePaymentRequestDto = {
        amount,
        note: payNote.trim() || undefined,
        noteVoiceMediaId: payNoteVoice?.mediaId,
        noteVoiceDurationMs: payNoteVoice?.durationMs,
        instructions: payHow.trim() || undefined,
      };
      return api.post(`/orders/${id}/payment-requests`, dto);
    },
    onSuccess: () => {
      setPayOpen(false);
      setPayNote('');
      setPayNoteVoice(null);
      setPayError(null);
      refresh();
      showToast('Asked for payment.');
    },
    onError: (err) => setPayError(actionErrorMessage(err, 'Could not ask for payment.')),
  });

  const payAct = useMutation({
    mutationFn: ({ askId, action }: { askId: string; action: 'paid' | 'received' }) =>
      api.post(`/payment-requests/${askId}/${action}`, {}),
    onSuccess: () => {
      refresh();
      showToast('Updated.');
    },
    onError: (err) => showToast(actionErrorMessage(err, 'Could not update payment.'), 'danger'),
  });

  const openPaySheet = () => {
    const suggested = suggestedPaymentAmount(order.data?.items ?? []);
    setPayAmount(suggested > 0 ? String(suggested) : '');
    setPayNote('');
    setPayHow('');
    setPayError(null);
    setPayOpen(true);
  };

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
      return api.post<OrderView>(`/orders/${id}/amend`, {
        items,
        note: amendNote.trim() || undefined,
        noteVoiceMediaId: amendNoteVoice?.mediaId,
        noteVoiceDurationMs: amendNoteVoice?.durationMs,
      });
    },
    onSuccess: () => {
      setAmendOpen(false);
      setAmendNote('');
      setAmendNoteVoice(null);
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
        note: dispatchNote.trim() || undefined,
        noteVoiceMediaId: dispatchNoteVoice?.mediaId,
        noteVoiceDurationMs: dispatchNoteVoice?.durationMs,
      };
      return api.post<OrderView>(`/orders/${id}/dispatch`, dto);
    },
    onSuccess: () => {
      setDispatchOpen(false);
      setDispatchError(null);
      setDispatchNote('');
      setDispatchNoteVoice(null);
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

  const settleOrder = useMutation({
    mutationFn: () =>
      api.post<OrderView>(`/orders/${id}/settle`, {
        note: settleNote.trim() || undefined,
        noteVoiceMediaId: settleNoteVoice?.mediaId,
        noteVoiceDurationMs: settleNoteVoice?.durationMs,
      }),
    onSuccess: (updated) => {
      setSettleOpen(false);
      setSettleNote('');
      setSettleNoteVoice(null);
      setSheetError(null);
      queryClient.setQueryData(['order', id], updated);
      refresh();
      if (updated.threadId) {
        void queryClient.invalidateQueries({
          queryKey: ['thread', updated.threadId, 'messages'],
        });
      }
      showToast('Order settled.');
    },
    onError: (err) => setSheetError(actionErrorMessage(err, 'Could not settle.')),
  });

  const sendQuote = useMutation({
    mutationFn: () => {
      const dto: QuoteOrderDto = {
        note: quoteNote || undefined,
        noteVoiceMediaId: quoteNoteVoice?.mediaId,
        noteVoiceDurationMs: quoteNoteVoice?.durationMs,
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
      setQuoteNote('');
      setQuoteNoteVoice(null);
      setQuoteVoiceBusy(false);
      setSheetError(null);
      refresh();
      if (updated.threadId) {
        void queryClient.invalidateQueries({ queryKey: ['thread', updated.threadId, 'messages'] });
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
        note: linesNote.trim() || undefined,
        noteVoiceMediaId: linesNoteVoice?.mediaId,
        noteVoiceDurationMs: linesNoteVoice?.durationMs,
      };
      return api.post<OrderView>(`/orders/${id}/lines/decide`, dto);
    },
    onSuccess: () => {
      setLinesOpen(false);
      setLinesNote('');
      setLinesNoteVoice(null);
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
        reasonVoiceMediaId: returnReasonVoice?.mediaId,
        reasonVoiceDurationMs: returnReasonVoice?.durationMs,
        items,
      };
      return api.post('/returns', dto);
    },
    onSuccess: () => {
      setReturnOpen(false);
      setReturnReason('');
      setReturnReasonVoice(null);
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
    const data = order.data;
    if (!data) return;
    const prefill = quotePrefillFromMills(data.items, data.millDesks);
    const initialUnavail: Record<string, boolean> = {};
    const openIds: string[] = [];
    for (const item of data.items) {
      if (item.lineStatus !== 'open') continue;
      initialUnavail[item.id] = false;
      openIds.push(item.id);
    }
    const prefills = openIds.map((id) => prefill.rates[id] ?? '').filter((v) => v !== '');
    const allSame =
      prefills.length > 0 && prefills.length === openIds.length && prefills.every((v) => v === prefills[0]);
    setRates(prefill.rates);
    setQuoteRateDefaults(prefill.rates);
    setOfferQty(prefill.qty);
    setUnavailable(initialUnavail);
    setSharedQuoteRate(allSame ? prefills[0]! : '');
    setQuoteNote('');
    setQuoteNoteVoice(null);
    setQuoteVoiceBusy(false);
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
    const returnable = (order.data?.items ?? []).filter((item) => item.lineStatus !== 'declined');
    const next = selectAllReturnLines(returnable);
    setReturnSelected(next.selected);
    setReturnQty(next.qty);
    setSheetError(null);
    setReturnReason('');
    setReturnOpen(true);
  };

  const closeSheet = (
    which: 'quote' | 'lines' | 'dispatch' | 'settle' | 'amend' | 'return' | 'pay',
  ) => {
    setSheetError(null);
    if (which === 'quote') setQuoteOpen(false);
    if (which === 'lines') setLinesOpen(false);
    if (which === 'dispatch') {
      setDispatchError(null);
      setDispatchOpen(false);
    }
    if (which === 'settle') setSettleOpen(false);
    if (which === 'amend') setAmendOpen(false);
    if (which === 'return') setReturnOpen(false);
    if (which === 'pay') {
      setPayError(null);
      setPayOpen(false);
    }
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
  const returnAllSelected = useMemo(
    () => allReturnLinesSelected(returnableItems, returnSelected),
    [returnableItems, returnSelected],
  );

  const selectAllReturnable = () => {
    setSheetError(null);
    const next = selectAllReturnLines(returnableItems);
    setReturnSelected(next.selected);
    setReturnQty(next.qty);
  };

  const clearReturnable = () => {
    setSheetError(null);
    setReturnSelected(clearReturnSelection(returnableItems));
  };

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
  const photoGallery = orderItemGalleryUrls(data.items);
  const openPhotoViewer = (index: number) => {
    setPhotoViewerIndex(index);
    setPhotoViewerOpen(true);
  };
  const isSeller = data.direction === 'selling';
  const isBuyer = data.direction === 'buying';
  const hasRemaining = data.items.some((item) => item.remainingQuantity > 0);
  const openForDispatch =
    data.status === 'confirmed' || data.status === 'part_shipped';
  // BM-09: millDesks on a buyer (Reveal ON) are identity only — not trader Desk chrome.
  const behindTakeOver = orderDetailBehindTakeOver(data.direction, data.millDesks);
  const millsObserve = millsObserveMode(data.laneTicket, data.millDesks);
  const quoteOnFace = millsObserve
    ? false
    : !behindTakeOver || showSendQuoteOnDeskFace(data.millDesks, data.laneTicket);
  const millSendOnCard = showMillSendOnCard(data.laneTicket, data.millDesks, takeOverOpen);
  const takeOverHasWork = orderDetailTakeOverHasWork({
    direction: data.direction,
    millDesks: data.millDesks,
    laneTicket: data.laneTicket,
    threadId: data.threadId,
    canAskPayment: data.canAskPayment,
    status: data.status,
    openForDispatch,
    hasRemaining,
    canSettle: data.canSettle,
  });
  const nextCue = orderDetailNextCue({
    direction: data.direction,
    status: data.status,
    counterpartName: data.counterpart.name,
    hasSellerQuote: data.hasSellerQuote === true,
    millDesks: data.millDesks,
    laneTicket: data.laneTicket,
    partiallyShipped: data.partiallyShipped,
    intent: data.intent,
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
      : data.tradeMode === 'manage' && data.direction === 'selling'
        ? `Trading with ${data.counterpart.name}`
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
            {/* Part shipped is only a mid-fulfillment pill/timeline cue — never after Settled. */}
            {data.partiallyShipped &&
            data.status === 'confirmed' &&
            data.status !== 'settled' ? (
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

      {data.canFlipTicket ? (
        <div data-testid="order-ticket-flip">
        <Card className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-ink">This order is with</p>
          <p className="text-xs text-muted">Only before the mill responds. Updates this order and next ones.</p>
          {(
            [
              { value: 'me' as const, label: 'With me', names: [] as string[] },
              {
                value: 'mill' as const,
                label: orderTicketMillLabel(
                  data.millDesks,
                  data.tradeMode === 'direct' ? data.sellerName : 'Mills',
                ),
                names: orderTicketMillNames(data.millDesks),
              },
            ] as const
          ).map((option) => {
            const selected = (data.laneTicket ?? 'me') === option.value;
            return (
              <button
                key={option.value}
                type="button"
                data-testid={`order-ticket-${option.value}`}
                disabled={flipTicket.isPending || selected}
                onClick={() => flipTicket.mutate({ ticket: option.value })}
                className={`w-full rounded-xl border px-3 py-2.5 text-left ${
                  selected ? 'border-accent bg-accent/5' : 'border-line bg-surface'
                }`}
              >
                <p className="text-sm font-semibold text-ink">{option.label}</p>
                {option.names.length > 0 ? (
                  <ul className="mt-1 flex flex-col gap-0.5" data-testid="order-ticket-mill-names">
                    {option.names.map((name) => (
                      <li key={name} className="text-xs text-muted">
                        {name}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </button>
            );
          })}
        </Card>
        </div>
      ) : null}

      <Card className="flex flex-col gap-1 text-sm">
        <p className="font-semibold text-ink">Parties</p>
        <p className="text-muted">
          Buyer · <span className="font-medium text-ink">{data.buyerName}</span>
          {data.direction === 'buying' ? ' (you)' : ''}
        </p>
        <p className="text-muted">
          {data.tradeMode === 'manage' ? 'Trader' : 'Seller'} ·{' '}
          <span className="font-medium text-ink">{data.sellerName}</span>
          {data.direction === 'selling' ? ' (you)' : ''}
        </p>
        {data.tradeMode === 'direct' &&
        data.facilitatorCompanyId &&
        companyId === data.facilitatorCompanyId ? (
          <p className="pt-1 text-sm font-medium text-accent">Shared</p>
        ) : null}
        {(data.status === 'confirmed' || data.status === 'part_shipped') &&
        (data.confirmedByName || data.confirmedByRole) ? (
          <p className="pt-1 text-muted">
            {agreementStepLabel(data.confirmedByRole, data.confirmedByName)}
          </p>
        ) : null}
        {auditLine(data) ? (
          <p className="text-xs text-muted">{auditLine(data)}</p>
        ) : null}
      </Card>

      {data.needsQuotePass ? (
        <p className="rounded-xl bg-warning-soft px-3 py-2 text-sm font-medium text-warning-ink">
          Mill sent rates — the buyer has not seen them
        </p>
      ) : null}

      {data.millDesks && data.millDesks.length > 0
        ? data.millDesks.map((desk) => {
            const rows = itemsForMill(data.items, desk);
            const cue = millCue(desk);
            if (isBuyer) {
              return (
                <Card
                  key={desk.upstreamOrderId}
                  className="flex flex-col gap-3"
                  data-testid={`order-buyer-mill-${desk.upstreamOrderId}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {desk.sellerName}
                        {!desk.held ? (
                          <span className="ml-1.5 text-xs font-semibold text-accent">
                            {shortOrderLabel(desk.upstreamOrderId)}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted">
                        {desk.held
                          ? 'With your trader — not sent to the mill yet'
                          : cue ?? `${rows.length} design${rows.length === 1 ? '' : 's'}`}
                      </p>
                    </div>
                    {!desk.held ? (
                      <StatusPill status={desk.status === 'requested' ? 'requested' : desk.status} />
                    ) : null}
                  </div>
                  {rows.map((item) => {
                    const millLine = millLineForParent(desk, item.id);
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 border-t border-line pt-3"
                      >
                        <OrderLinePhoto item={item} items={data.items} onOpen={openPhotoViewer} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                          <p className="text-xs text-muted">
                            {item.quantity} × {formatRate(item.rate, item.unit)}
                            {millLine?.millRate != null && desk.millQuoted
                              ? ` · mill ₹${millLine.millRate.toLocaleString('en-IN')}`
                              : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </Card>
              );
            }
            return (
              <Card key={desk.upstreamOrderId} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {desk.sellerName}
                      {!desk.held ? (
                        <span className="ml-1.5 text-xs font-semibold text-accent">
                          {shortOrderLabel(desk.upstreamOrderId)}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted">
                      {desk.held
                        ? 'Mill cannot see this yet'
                        : desk.passHeld
                          ? 'Held'
                          : cue ?? `${rows.length} design${rows.length === 1 ? '' : 's'}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!desk.held ? (
                      <StatusPill status={desk.status === 'requested' ? 'requested' : desk.status} />
                    ) : null}
                    {!desk.held ? (
                      <details className="relative">
                        <summary className="cursor-pointer list-none px-1 text-lg leading-none text-muted">
                          ⋯
                        </summary>
                        <div className="absolute right-0 z-20 mt-1 min-w-[9rem] rounded-xl border border-line bg-surface p-1 shadow-sm">
                          <button
                            type="button"
                            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-foam"
                            disabled={millHold.isPending}
                            onClick={() =>
                              millHold.mutate({
                                upstreamOrderId: desk.upstreamOrderId,
                                held: !desk.passHeld,
                              })
                            }
                          >
                            {desk.passHeld ? `Resume ${desk.sellerName}` : `Hold ${desk.sellerName}`}
                          </button>
                        </div>
                      </details>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  data-testid={`order-mill-reveal-${desk.upstreamOrderId}`}
                  disabled={millReveal.isPending}
                  onClick={() =>
                    millReveal.mutate({
                      upstreamOrderId: desk.upstreamOrderId,
                      reveal: !desk.reveal,
                    })
                  }
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm ${
                    desk.reveal
                      ? 'border-accent bg-accent/5 text-ink'
                      : 'border-line bg-surface text-ink'
                  }`}
                >
                  <span>
                    <span className="font-medium">
                      {desk.sellerName} and {data.counterpart.name} can see each other
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {desk.reveal
                        ? 'One group chat. Order updates go there.'
                        : 'They only talk to you, not to each other.'}
                      {desk.reveal && desk.held
                        ? ' Group opens after you Send.'
                        : ''}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-accent">
                    {desk.reveal ? 'On' : 'Off'}
                  </span>
                </button>
                {!desk.held && desk.millQuoted ? (
                  <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_4.5rem] items-end gap-2 border-t border-line pt-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                      Design
                    </p>
                    <p className="text-center text-[10px] font-bold uppercase tracking-wide text-muted">
                      From
                      <span className="mt-0.5 block truncate normal-case tracking-normal text-muted">
                        {desk.sellerName}
                      </span>
                    </p>
                    <p className="text-center text-[10px] font-bold uppercase tracking-wide text-muted">
                      To
                      <span className="mt-0.5 block truncate normal-case tracking-normal text-muted">
                        {data.counterpart.name}
                      </span>
                    </p>
                  </div>
                ) : null}
                {desk.held ? (
                  <div className="flex flex-col gap-2 border-t border-line pt-2">
                    {rows.length > 1 ? (
                      <Field label="Rate all">
                        <TextInput
                          type="number"
                          min={0}
                          placeholder="Rate all"
                          value={sharedMillRate}
                          onChange={(event) => {
                            const value = event.target.value;
                            setSharedMillRate(value);
                            setMillRate((prev) => ({
                              ...prev,
                              ...ratesWithSharedValue(
                                rows.map((item) => item.id),
                                value,
                                millRateDefaults,
                              ),
                            }));
                          }}
                          aria-label="Rate all"
                        />
                      </Field>
                    ) : null}
                    <div className="grid grid-cols-[minmax(0,1fr)_5rem_5.5rem] gap-x-2 gap-y-0">
                      <p className="pb-2 text-[10px] font-bold uppercase tracking-wide text-muted">
                        Design
                      </p>
                      <p className="pb-2 text-center text-[10px] font-bold uppercase tracking-wide text-muted">
                        Qty
                      </p>
                      <p className="pb-2 text-center text-[10px] font-bold uppercase tracking-wide text-muted">
                        Rate
                      </p>
                      {rows.map((item) => (
                        <div
                          key={item.id}
                          className="col-span-3 grid grid-cols-subgrid items-center gap-x-2 border-t border-line pt-3"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <OrderLinePhoto
                              item={item}
                              items={data.items}
                              onOpen={openPhotoViewer}
                            />
                            <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                              {item.name}
                            </p>
                          </div>
                          <TextInput
                            type="number"
                            className={COMPACT_SHEET_NUM_INPUT_CLASS}
                            value={millQty[item.id] ?? String(item.quantity)}
                            onChange={(e) =>
                              setMillQty((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                            aria-label={`Quantity for ${item.name}`}
                          />
                          <TextInput
                            type="number"
                            className={COMPACT_SHEET_NUM_INPUT_CLASS}
                            value={
                              millRate[item.id] ?? (item.rate != null ? String(item.rate) : '')
                            }
                            onChange={(e) =>
                              setMillRate((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                            aria-label={`Rate for ${item.name}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  rows.map((item) => {
                    const millLine = millLineForParent(desk, item.id);
                    const cells = desk.millQuoted
                      ? millFromToCells({
                          millQuoted: true,
                          millDeclined: millLine?.millDeclined ?? false,
                          millRate: millLine?.millRate ?? null,
                          millQuantity: millLine?.millQuantity ?? null,
                          buyerQuoted: data.hasSellerQuote === true,
                          buyerRate: item.rate,
                          buyerQuantity: item.quantity,
                          unit: item.unit,
                          formatAmount: rateAmount,
                          formatUnitSuffix: rateUnitSuffix,
                        })
                      : null;
                    return (
                      <div
                        key={item.id}
                        className={cx(
                          'border-t border-line pt-3',
                          cells
                            ? 'grid grid-cols-[minmax(0,1fr)_4.5rem_4.5rem] items-center gap-2'
                            : 'flex items-center gap-3',
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <OrderLinePhoto
                            item={item}
                            items={data.items}
                            onOpen={openPhotoViewer}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                            {!cells ? (
                              <p className="text-xs text-muted">
                                {item.quantity} × {formatRate(item.rate, item.unit)}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        {cells ? (
                          <>
                            <RateFigure
                              amount={cells.fromAmount}
                              unit={cells.fromUnit}
                              qtyPrefix={cells.fromQtyPrefix || undefined}
                            />
                            <RateFigure
                              amount={cells.toAmount}
                              unit={cells.toUnit}
                              muted={!data.hasSellerQuote}
                            />
                          </>
                        ) : null}
                      </div>
                    );
                  })
                )}
                {desk.held && millSendOnCard ? (
                  <Button
                    onClick={() => {
                      const items = rows
                        .map((item) => ({
                          productId: item.productId ?? undefined,
                          quantity: Number(millQty[item.id] ?? item.quantity),
                          rate: millRate[item.id] ? Number(millRate[item.id]) : undefined,
                        }))
                        .filter((row) => row.productId);
                      sendUp.mutate({ upstreamOrderId: desk.upstreamOrderId, items });
                    }}
                    disabled={sendUp.isPending}
                  >
                    {sendUp.isPending ? 'Sending…' : `Send to ${desk.sellerName}`}
                  </Button>
                ) : desk.held && millsObserve ? (
                  <p className="text-xs text-muted">Desk tools to Send this mill</p>
                ) : desk.revealThreadId ? (
                  <Button
                    variant="secondary"
                    data-testid={`order-mill-open-chat-${desk.upstreamOrderId}`}
                    onClick={() => navigate(`/chats/${desk.revealThreadId}`)}
                  >
                    Open group chat
                  </Button>
                ) : null}
              </Card>
            );
          })
        : null}

      {!(data.millDesks && data.millDesks.length > 0) || isBuyer ? (
      <Card className="flex flex-col gap-3">
        {data.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <OrderLinePhoto item={item} items={data.items} onOpen={openPhotoViewer} />
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
        {data.noteVoiceUrl ? (
          <div className="border-t border-line pt-2">
            <VoicePlayer src={data.noteVoiceUrl} durationMs={data.noteVoiceDurationMs} />
          </div>
        ) : null}
        {data.hasSellerQuote && (data.quoteNote || data.quoteNoteVoiceUrl) ? (
          <div className="flex flex-col gap-1.5 border-t border-line pt-2">
            <p className="text-xs font-semibold text-ink">Quote note</p>
            {data.quoteNote ? (
              <p className="whitespace-pre-wrap text-sm text-muted">{data.quoteNote}</p>
            ) : null}
            {data.quoteNoteVoiceUrl ? (
              <VoicePlayer
                src={data.quoteNoteVoiceUrl}
                durationMs={data.quoteNoteVoiceDurationMs}
              />
            ) : null}
          </div>
        ) : null}
      </Card>
      ) : data.note || data.noteVoiceUrl ? (
        <Card className="flex flex-col gap-2">
          {data.note ? <p className="text-sm text-muted">{data.note}</p> : null}
          {data.noteVoiceUrl ? (
            <VoicePlayer src={data.noteVoiceUrl} durationMs={data.noteVoiceDurationMs} />
          ) : null}
        </Card>
      ) : null}

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
                {ret.reasonVoiceUrl ? (
                  <div className="mt-2">
                    <VoicePlayer
                      src={ret.reasonVoiceUrl}
                      durationMs={ret.reasonVoiceDurationMs}
                    />
                  </div>
                ) : null}
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

      {(data.paymentRequests?.length ?? 0) > 0 ? (
        <Card className="flex flex-col gap-3 text-sm">
          <p className="font-semibold text-ink">Payment</p>
          {data.paymentRequests!.map((ask) => (
            <div key={ask.id} className="border-t border-line pt-2 first:border-0 first:pt-0">
              <p className="font-medium text-ink">
                {ask.status === 'paid' ? 'Paid' : 'Asked'} · ₹
                {ask.amount.toLocaleString('en-IN')}
              </p>
              {ask.note ? <p className="text-muted">{ask.note}</p> : null}
              {ask.noteVoiceUrl ? (
                <div className="mt-1">
                  <VoicePlayer src={ask.noteVoiceUrl} durationMs={ask.noteVoiceDurationMs} />
                </div>
              ) : null}
              {ask.instructions ? <p className="text-muted">{ask.instructions}</p> : null}
              {ask.status === 'paid' && ask.paidAt ? (
                <p className="text-muted">{formatDate(ask.paidAt)}</p>
              ) : null}
              {ask.status === 'open' && isBuyer ? (
                <Button
                  className="mt-2"
                  onClick={() => payAct.mutate({ askId: ask.id, action: 'paid' })}
                  disabled={payAct.isPending}
                >
                  Paid
                </Button>
              ) : null}
              {ask.status === 'open' && isSeller ? (
                <Button
                  className="mt-2"
                  onClick={() => payAct.mutate({ askId: ask.id, action: 'received' })}
                  disabled={payAct.isPending}
                >
                  Mark received
                </Button>
              ) : null}
            </div>
          ))}
        </Card>
      ) : null}

      <div className="flex flex-col gap-2">
        {!behindTakeOver && data.threadId ? (
          <Button variant="secondary" onClick={() => navigate(`/chats/${data.threadId}`)}>
            Open chat
          </Button>
        ) : null}
        {!behindTakeOver && data.canAskPayment ? (
          <Button variant="secondary" onClick={openPaySheet}>
            Ask for payment
          </Button>
        ) : null}
        {isSeller && data.status === 'requested' ? (
          <>
            {quoteOnFace ? <Button onClick={openQuoteSheet}>Send quote</Button> : null}
            {showSellerConfirmOnDesk(data.millDesks) ? (
              <>
                <Button variant="secondary" onClick={openLinesSheet}>
                  Confirm / decline lines
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => act.mutate('confirm')}
                  disabled={act.isPending}
                >
                  Confirm all open
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setActionNote('');
                    setActionNoteVoice(null);
                    setActionNoteOpen('decline');
                  }}
                  disabled={act.isPending || actionWithNote.isPending}
                >
                  Decline order
                </Button>
              </>
            ) : null}
          </>
        ) : null}
        {data.canSendUp && !(data.millDesks && data.millDesks.length > 0) ? (
          <>
            <Button onClick={() => sendUp.mutate({})} disabled={sendUp.isPending}>
              {sendUp.isPending ? 'Sending…' : 'Send'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const qty: Record<string, string> = {};
                const rate: Record<string, string> = {};
                for (const item of data.items) {
                  if (!item.productId) continue;
                  qty[item.productId] = String(item.quantity);
                  rate[item.productId] = item.rate != null ? String(item.rate) : '';
                }
                setChangeQty(qty);
                setChangeRate(rate);
                setSheetError(null);
                setChangeOpen(true);
              }}
            >
              Change
            </Button>
          </>
        ) : null}
        {data.canTakeControl ? (
          <Button
            variant="secondary"
            data-testid="order-handle-myself"
            onClick={() => takeControl.mutate()}
            disabled={takeControl.isPending}
          >
            Handle myself
          </Button>
        ) : null}
        {isBuyer && data.canAcceptLogged ? (
          <>
            <Button onClick={() => act.mutate('accept')} disabled={act.isPending}>
              Accept
            </Button>
            <Button variant="secondary" onClick={() => act.mutate('cancel')} disabled={act.isPending}>
              Decline
            </Button>
          </>
        ) : null}
        {isBuyer && data.canAcceptQuote ? (
          <Button onClick={() => act.mutate('accept-quote')} disabled={act.isPending}>
            Accept quote
          </Button>
        ) : null}
        {!behindTakeOver && isSeller && openForDispatch && hasRemaining ? (
          <Button data-testid="order-dispatch-open" onClick={openDispatchSheet}>
            {data.partiallyShipped ? 'Dispatch more' : 'Dispatch shipment'}
          </Button>
        ) : null}
        {!behindTakeOver && isSeller && data.canSettle ? (
          <Button
            data-testid="order-settle-open"
            variant="secondary"
            onClick={() => {
              setSettleNote('');
              setSettleNoteVoice(null);
              setSheetError(null);
              setSettleOpen(true);
            }}
          >
            Settle order
          </Button>
        ) : null}
        {takeOverHasWork ? (
          <div className="flex flex-col gap-2" data-testid="order-take-over">
            <Button
              variant="secondary"
              data-testid="order-take-over-toggle"
              onClick={() => setTakeOverOpen((open) => !open)}
            >
              {takeOverOpen ? 'Hide desk tools' : 'Desk tools'}
            </Button>
            {takeOverOpen ? (
              <>
                {isSeller && data.status === 'requested' && !quoteOnFace ? (
                  <Button onClick={openQuoteSheet}>Send quote</Button>
                ) : null}
                {data.threadId ? (
                  <Button variant="secondary" onClick={() => navigate(`/chats/${data.threadId}`)}>
                    Open chat
                  </Button>
                ) : null}
                {data.canAskPayment ? (
                  <Button variant="secondary" onClick={openPaySheet}>
                    Ask for payment
                  </Button>
                ) : null}
                {isSeller && data.status === 'requested' ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setActionNote('');
                      setActionNoteVoice(null);
                      setActionNoteOpen('decline');
                    }}
                    disabled={act.isPending || actionWithNote.isPending}
                  >
                    Decline order
                  </Button>
                ) : null}
                {isSeller && openForDispatch && hasRemaining ? (
                  <Button data-testid="order-dispatch-open" onClick={openDispatchSheet}>
                    {data.partiallyShipped ? 'Dispatch more' : 'Dispatch shipment'}
                  </Button>
                ) : null}
                {isSeller && data.canSettle ? (
                  <Button
                    data-testid="order-settle-open"
                    variant="secondary"
                    onClick={() => {
                      setSettleNote('');
                      setSettleNoteVoice(null);
                      setSheetError(null);
                      setSettleOpen(true);
                    }}
                  >
                    Settle order
                  </Button>
                ) : null}
                <Button variant="ghost" onClick={() => navigate(`/company/${data.counterpart.id}`)}>
                  View {data.counterpart.name}
                </Button>
              </>
            ) : null}
          </div>
        ) : null}
        {isBuyer && data.canAmend ? (
          <Button variant="secondary" onClick={openAmendSheet}>
            {isInquiry ? 'Edit inquiry' : 'Edit order'}
          </Button>
        ) : null}
        {isBuyer && (data.status === 'requested' || data.status === 'confirmed') ? (
          <Button
            variant="secondary"
            onClick={() => {
              setActionNote('');
              setActionNoteVoice(null);
              setActionNoteOpen('cancel');
            }}
            disabled={act.isPending || actionWithNote.isPending}
          >
            {isInquiry && data.status === 'requested' ? 'Cancel inquiry' : 'Cancel order'}
          </Button>
        ) : null}
        {isBuyer && (data.status === 'delivered' || data.status === 'settled' || data.status === 'dispatched') ? (
          <Button variant="secondary" onClick={openReturnSheet}>
            Raise a return
          </Button>
        ) : null}
        {!behindTakeOver ? (
          <Button variant="ghost" onClick={() => navigate(`/company/${data.counterpart.id}`)}>
            View {data.counterpart.name}
          </Button>
        ) : null}
      </div>

      <Sheet open={quoteOpen} onClose={() => closeSheet('quote')} title="Send quote">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            Quoting {quoteSummary.count} of {quoteSummary.of} open · ₹
            {quoteSummary.total.toLocaleString('en-IN')}
          </p>
          {openItems.filter((item) => !unavailable[item.id]).length > 1 ? (
            <Field label="Rate all">
              <TextInput
                type="number"
                min={0}
                placeholder="Rate all"
                className="min-h-10"
                value={sharedQuoteRate}
                onChange={(event) => {
                  const value = event.target.value;
                  setSharedQuoteRate(value);
                  const ids = openItems
                    .filter((item) => !unavailable[item.id])
                    .map((item) => item.id);
                  setRates((prev) => ({
                    ...prev,
                    ...ratesWithSharedValue(ids, value, quoteRateDefaults),
                  }));
                }}
                aria-label="Rate all"
              />
            </Field>
          ) : null}
          {(() => {
            const showFrom = (data.millDesks ?? []).some((desk) => desk.millQuoted && !desk.held);
            const cols = showFrom
              ? 'grid-cols-[minmax(0,1fr)_3.75rem_5rem_5.5rem]'
              : 'grid-cols-[minmax(0,1fr)_5rem_5.5rem]';
            const span = showFrom ? 4 : 3;
            return (
              <div className={cx('grid gap-x-2 gap-y-0', cols)}>
                <p className="pb-1 text-[10px] font-bold uppercase tracking-wide text-muted">
                  Design
                </p>
                {showFrom ? (
                  <p className="pb-1 text-center text-[10px] font-bold uppercase tracking-wide text-muted">
                    From
                  </p>
                ) : null}
                <p className="pb-1 text-center text-[10px] font-bold uppercase tracking-wide text-muted">
                  Qty
                </p>
                <p className="pb-1 text-center text-[10px] font-bold uppercase tracking-wide text-muted">
                  Rate
                </p>
                {openItems.map((item) => {
                  const millLine = (data.millDesks ?? [])
                    .filter((desk) => desk.millQuoted && !desk.held)
                    .map((desk) => ({ desk, line: millLineForParent(desk, item.id) }))
                    .find((row) => row.line && !row.line.millDeclined && row.line.millRate != null);
                  const fromRate = millLine?.line?.millRate ?? null;
                  const fromUnit = fromRate != null ? rateUnitSuffix(item.unit) : '';
                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-subgrid items-center gap-x-2 border-t border-line py-2"
                      style={{ gridColumn: `span ${span} / span ${span}` }}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                        <label className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5"
                            checked={Boolean(unavailable[item.id])}
                            onChange={(event) =>
                              setUnavailable((prev) => ({
                                ...prev,
                                [item.id]: event.target.checked,
                              }))
                            }
                          />
                          Can’t supply
                        </label>
                      </div>
                      {showFrom ? (
                        unavailable[item.id] ? (
                          <p className="text-center text-[11px] text-muted">—</p>
                        ) : fromRate != null ? (
                          <div className="text-center">
                            <p className="text-sm font-semibold tabular-nums text-ink">
                              {rateAmount(fromRate)}
                            </p>
                            {fromUnit ? (
                              <p className="text-[10px] font-normal text-muted">{fromUnit}</p>
                            ) : null}
                          </div>
                        ) : (
                          <p className="text-center text-[11px] text-muted">—</p>
                        )
                      ) : null}
                      {!unavailable[item.id] ? (
                        <TextInput
                          type="number"
                          min={1}
                          max={item.requestedQuantity}
                          className={COMPACT_SHEET_NUM_INPUT_CLASS}
                          value={offerQty[item.id] ?? ''}
                          onChange={(event) =>
                            setOfferQty((prev) => ({ ...prev, [item.id]: event.target.value }))
                          }
                          aria-label={`Quantity for ${item.name}`}
                        />
                      ) : (
                        <p className="text-center text-[11px] text-muted">—</p>
                      )}
                      {unavailable[item.id] ? (
                        <p className="text-center text-[11px] text-muted">Skip</p>
                      ) : (
                        <TextInput
                          type="number"
                          min={0}
                          placeholder="Rate"
                          className={COMPACT_SHEET_NUM_INPUT_CLASS}
                          value={rates[item.id] ?? ''}
                          onChange={(event) =>
                            setRates((prev) => ({ ...prev, [item.id]: event.target.value }))
                          }
                          aria-label={`Rate for ${item.name}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
          <NoteVoiceField
            label="Note"
            note={quoteNote}
            onNoteChange={setQuoteNote}
            voice={quoteNoteVoice}
            onVoiceChange={setQuoteNoteVoice}
            onBusyChange={setQuoteVoiceBusy}
          />
          {sheetError && quoteOpen ? <InlineNotice message={sheetError} /> : null}
          <Button
            fullWidth
            disabled={!quoteReady || sendQuote.isPending || quoteVoiceBusy}
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
          <NoteVoiceField
            label="Note"
            note={linesNote}
            onNoteChange={setLinesNote}
            voice={linesNoteVoice}
            onVoiceChange={setLinesNoteVoice}
          />
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
            <Button
              fullWidth
              data-testid="order-dispatch-confirm"
              onClick={submitDispatch}
              disabled={dispatchOrder.isPending}
            >
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
                className="flex items-center gap-3 border-b border-line py-2 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p
                    data-testid="order-dispatch-line-name"
                    className="truncate text-sm font-semibold text-ink"
                  >
                    {item.name}
                  </p>
                  <p className="text-[11px] text-muted">left {item.remainingQuantity}</p>
                </div>
                <TextInput
                  type="number"
                  min={0}
                  max={item.remainingQuantity}
                  data-testid="order-dispatch-line-qty"
                  className={COMPACT_QTY_INPUT_CLASS}
                  value={shipQty[item.id] ?? ''}
                  onChange={(event) =>
                    setShipQty((prev) => ({ ...prev, [item.id]: event.target.value }))
                  }
                />
              </div>
            ))
          )}
          <NoteVoiceField
            label="Note"
            note={dispatchNote}
            onNoteChange={setDispatchNote}
            voice={dispatchNoteVoice}
            onVoiceChange={setDispatchNoteVoice}
          />
        </div>
      </Sheet>

      <Sheet
        open={settleOpen}
        onClose={() => closeSheet('settle')}
        title="Settle order"
        footer={
          <Button
            fullWidth
            data-testid="order-settle-confirm"
            disabled={settleOrder.isPending}
            onClick={() => settleOrder.mutate()}
          >
            {settleOrder.isPending ? 'Settling…' : 'Settle order'}
          </Button>
        }
      >
        <div className="flex flex-col gap-3 pb-2">
          <p className="text-sm text-muted">
            Won’t ship the rest. Quantities become what already left, and this ticket closes as
            Settled.
          </p>
          {(data.items ?? [])
            .filter((item) => item.lineStatus !== 'declined')
            .map((item) => {
              const shipped = item.shippedQuantity ?? 0;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-line p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                    <p className="text-xs text-muted">
                      Asked {item.requestedQuantity} · final {shipped}
                    </p>
                  </div>
                </div>
              );
            })}
          <NoteVoiceField
            label="Note"
            note={settleNote}
            onNoteChange={setSettleNote}
            voice={settleNoteVoice}
            onVoiceChange={setSettleNoteVoice}
          />
          {sheetError && settleOpen ? <InlineNotice message={sheetError} /> : null}
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
                      className={COMPACT_QTY_INPUT_CLASS}
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
          <NoteVoiceField
            label="Note"
            note={amendNote}
            onNoteChange={setAmendNote}
            voice={amendNoteVoice}
            onVoiceChange={setAmendNoteVoice}
          />
          <Button fullWidth onClick={() => amendOrder.mutate()} disabled={amendOrder.isPending}>
            {amendOrder.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </Sheet>

      <Sheet open={returnOpen} onClose={() => closeSheet('return')} title="Raise a return">
        <div className="flex flex-col gap-3">
          {returnableItems.length > 0 ? (
            <div
              data-testid="return-raise-select-chrome"
              className="flex items-center justify-between gap-2"
            >
              <p className="text-sm font-semibold text-ink">
                {returnSelectedCount} of {returnableItems.length} selected
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  data-testid="return-raise-select-all"
                  disabled={returnAllSelected}
                  className="text-xs font-bold text-accent disabled:opacity-40"
                  onClick={selectAllReturnable}
                >
                  Select all
                </button>
                <button
                  type="button"
                  data-testid="return-raise-clear"
                  className="text-xs font-bold text-accent"
                  onClick={clearReturnable}
                >
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">Pick designs to return</p>
          )}
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
                    <OrderLinePhoto
                      item={item}
                      items={order.data?.items ?? []}
                      onOpen={openPhotoViewer}
                      size="sm"
                    />
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
                    className={COMPACT_QTY_INPUT_CLASS}
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
          <NoteVoiceField
            label="Note"
            note={returnReason}
            onNoteChange={(value) => {
              setSheetError(null);
              setReturnReason(value);
            }}
            voice={returnReasonVoice}
            onVoiceChange={setReturnReasonVoice}
          />
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

      <Sheet
        open={changeOpen}
        onClose={() => setChangeOpen(false)}
        title="Change"
        footer={
          <Button
            fullWidth
            disabled={sendUp.isPending}
            onClick={() => {
              const items = (order.data?.items ?? [])
                .filter((item) => item.productId)
                .map((item) => {
                  const qty = Number(changeQty[item.productId!]);
                  const rateRaw = changeRate[item.productId!]?.trim();
                  const rate = rateRaw === '' ? undefined : Number(rateRaw);
                  return {
                    productId: item.productId!,
                    ...(Number.isFinite(qty) && qty > 0 ? { quantity: qty } : {}),
                    ...(rate != null && Number.isFinite(rate) ? { rate } : {}),
                  };
                });
              sendUp.mutate({ items });
            }}
          >
            {sendUp.isPending ? 'Sending…' : 'Send'}
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">Edit qty or rate, then Send to the design owners.</p>
          {(order.data?.items ?? [])
            .filter((item) => item.productId)
            .map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <OrderLinePhoto
                  item={item}
                  items={order.data?.items ?? []}
                  onOpen={openPhotoViewer}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                  <div className="mt-1 flex gap-2">
                    <Field label="Qty">
                      <TextInput
                        type="number"
                        min={1}
                        className="min-h-10"
                        value={changeQty[item.productId!] ?? ''}
                        onChange={(event) =>
                          setChangeQty((prev) => ({
                            ...prev,
                            [item.productId!]: event.target.value,
                          }))
                        }
                      />
                    </Field>
                    <Field label="Rate">
                      <TextInput
                        type="number"
                        min={0}
                        className="min-h-10"
                        value={changeRate[item.productId!] ?? ''}
                        onChange={(event) =>
                          setChangeRate((prev) => ({
                            ...prev,
                            [item.productId!]: event.target.value,
                          }))
                        }
                      />
                    </Field>
                  </div>
                </div>
              </div>
            ))}
          {sheetError && changeOpen ? <InlineNotice message={sheetError} /> : null}
        </div>
      </Sheet>

      <Sheet
        open={payOpen}
        onClose={() => closeSheet('pay')}
        title="Ask for payment"
        footer={
          <Button fullWidth onClick={() => askPay.mutate()} disabled={askPay.isPending}>
            {askPay.isPending ? 'Asking…' : 'Ask for payment'}
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          <Field label="Amount">
            <TextInput
              type="number"
              min={0}
              inputMode="decimal"
              value={payAmount}
              placeholder="₹"
              onChange={(event) => setPayAmount(event.target.value)}
            />
          </Field>
          <NoteVoiceField
            label="Note"
            note={payNote}
            onNoteChange={setPayNote}
            voice={payNoteVoice}
            onVoiceChange={setPayNoteVoice}
          />
          <Field label="Pay how">
            <TextArea
              value={payHow}
              placeholder="UPI / bank — optional"
              onChange={(event) => setPayHow(event.target.value)}
            />
          </Field>
          {payError ? <InlineNotice message={payError} /> : null}
        </div>
      </Sheet>

      <Sheet
        open={actionNoteOpen != null}
        onClose={() => setActionNoteOpen(null)}
        title={actionNoteOpen === 'decline' ? 'Decline order' : 'Cancel order'}
        footer={
          <Button
            fullWidth
            disabled={actionWithNote.isPending}
            onClick={() => actionWithNote.mutate()}
          >
            {actionWithNote.isPending
              ? 'Saving…'
              : actionNoteOpen === 'decline'
                ? 'Decline order'
                : 'Cancel order'}
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">Optional note for the other shop.</p>
          <NoteVoiceField
            label="Note"
            note={actionNote}
            onNoteChange={setActionNote}
            voice={actionNoteVoice}
            onVoiceChange={setActionNoteVoice}
          />
        </div>
      </Sheet>

      <PhotoViewer
        open={photoViewerOpen && photoGallery.length > 0}
        urls={photoGallery}
        index={photoViewerIndex}
        onIndex={setPhotoViewerIndex}
        onClose={() => setPhotoViewerOpen(false)}
      />
    </div>
  );
}
