import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MEDIA_VARIANT,
  agreementStepLabel,
  buildOrderTimelineSteps,
  collapseQuotedTrailEvents,
  shortOrderLabel,
  OrderTrailType,
  type DecideOrderLinesDto,
  type DispatchDto,
  type EditShipmentDto,
  type ComplaintView,
  type CursorPage,
  type OrderItemView,
  type OrderView,
  type SendUpOrderDto,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import {
  galleryIndexForItem,
  orderItemGalleryCaptions,
  orderItemGalleryDetails,
  orderItemGalleryUrls,
  urlsForOrderItem,
} from '@/features/orders/orderItemImages';
import { useCompanyId } from '@/lib/auth';
import { formatDate, formatRate, formatUnit } from '@/lib/format';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';
import { ManagedImage } from '@/ui/ManagedImage';
import { navigateBackOr } from '@/lib/navigateBackOr';
import { PageHeader } from '@/ui/PageHeader';
import { ConfirmActionSheet } from '@/ui/ConfirmActionSheet';
import {
  orderLineOverShipped,
  orderLineShowsPending,
} from '@/features/orders/shipProgressLabel';
import {
  defaultDispatchOn,
  defaultDispatchQty,
  dispatchPayloadLines,
  dispatchThisLrTally,
  dispatchThisLrFooterSummary,
  emptyDispatchLeg,
  lineDispatchQty,
  resizeDispatchLegs,
  seedDispatchLegsFromShipment,
  shipmentLegDisplayLines,
  shipmentLegImageUrls,
  fulfillDispatchItems,
  dispatchQtyAfterSelect,
  cantSupplyDispatchItems,
  previousDispatchesCue,
  type DispatchLegDraft,
} from '@/features/orders/dispatchSheet';
import {
  clampSettleQtyInput,
  defaultSettleFinalQty,
  lineSettleFinalQty,
  orderLineFactsForSettleRemainder,
  settleLeftoverFooterSummary,
  settlePayloadLines,
  settleSheetItems,
} from '@/features/orders/settleSheet';
import { sellerCanFulfillEdit } from '@/features/orders/lineFulfillCard';
import { OrderLineFulfillExpand } from '@/features/orders/OrderLineFulfillExpand';
import {
  newestFirstTrail,
  timelineUpdatedDot,
  timelineVisibleSlice,
} from '@/features/orders/orderTimelineDisplay';
import { explorePostedWhen } from '@/ui/cards';
import {
  decideLinesConfirmExtras,
  decideLinesConfirmReady,
  decideLinesPayload,
  decideLinesTally,
  defaultLineActions,
  qtysWithSharedValue,
} from '@/features/orders/decideLinesSheet';
import { partyCompanyHref } from '@/features/orders/partyCompanyHref';
import {
  packingSlipFileName,
  packingSlipPdfBytes,
  openPackingSlipPdf,
  shareOrDownloadPdf,
  type PackingSlipOptions,
} from '@/features/orders/packingSlip';
import {
  orderFormFileName,
  orderFormPdfBytes,
} from '@/features/orders/orderForm';
import { PhotoViewer } from '@/ui/PhotoViewer';
import { tradeListStatusLabel } from '@/features/orders/tradeListProtocol';
import {
  ChatIcon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  CloseIcon,
  DocumentIcon,
  MegaphoneIcon,
  MoreHorizontalIcon,
  PdfIcon,
  PencilIcon,
} from '@/ui/icons';
import { MoreActionsSheet } from '@/ui/MoreActionsSheet';
import { useToast } from '@/ui/Toast';
import {
  complaintAgainstTargets,
  complaintRoleCue,
  type ComplaintAgainstTarget,
} from '@/features/orders/complaintAgainstTargets';
import { LegPhotoAttach, LegPhotoThumbs } from '@/features/orders/LegPhotoAttach';
import { NoteAttachField } from '@/features/voice/NoteAttachField';
import { type NoteVoiceValue } from '@/features/voice/NoteVoiceField';
import { VoicePlayer } from '@/features/voice/VoicePlayer';
import { orderPartyLines, partyLineShowsOpenChat } from '@/features/orders/orderPartyLines';
import {
  orderTicketCanForwardNotes,
  orderTicketForwardMills,
  orderTicketNotes,
  orderTicketProgress,
  orderTicketSubtitle,
  orderTicketWaitingCue,
} from '@/features/orders/orderTicketChrome';
import { OrderTicketNotes } from '@/features/orders/OrderTicketNotes';
import {
  OrderLineFacts,
  OrderLineMoneyLine,
  formatOrderLinePriceAmount,
  orderLineBalance,
  orderLineBalanceRowClass,
  orderLineFactsWithThisLr,
  orderTicketLineRateCopy,
} from '@/features/orders/OrderLineFacts';
import { QtyStepper } from '@/features/orders/QtyStepper';
import { OrderLineStack } from '@/features/orders/OrderLineStack';
import { OrderDesignTitle } from '@/features/orders/OrderDesignTitle';
import {
  howManyOrderUnitsMixed,
  lastGroupedItem,
  ticketDesignsCaption,
} from '@/features/orders/howManyLineMeta';
import { OrderQtyFooterSummary } from '@/features/orders/OrderQtyFooterSummary';
import { OrderLineNoteCue } from '@/features/orders/OrderLineNoteCue';
import { orderLineIdentitySecondary } from '@/features/orders/orderLineIdentity';
import {
  OrderTicketBillBlock,
  OrderUnitGroupedList,
  TicketLineWash,
} from '@/features/orders/OrderUnitGroupedList';
import { orderBillTotal } from '@/features/orders/orderLineBilling';
import { catalogRateDisplayUnit } from '@/lib/catalogRate';
import { AmendOrderSheet } from '@/features/orders/AmendOrderSheet';
import {
  catalogPeerProductIds,
  ticketBillItems,
  ticketDisplayItems,
} from '@/features/orders/orderCatalogDisplay';
import { CantSupplySwitch } from '@/features/orders/CantSupplySwitch';
import { TransporterField } from '@/features/orders/TransporterField';
import { rememberTransporter } from '@/features/orders/transporterMemory';
import { dispatchTransporterPrefill } from '@/features/orders/dispatchTransporterPrefill';
import {
  itemsForMill,
  millCue,
  millDeskCardClass,
  millDeskDropped,
  millFromToCells,
  millLineForParent,
  actorSellsThisOrder,
  orderActionDock,
  requestedDockPrimary,
  showMillSendAll,
  showOrderParentItemsList,
  showSellerConfirmOnDesk,
} from '@/features/orders/iHandleDesk';
import {
  parseQuoteRateDraft,
  quoteRateNumber,
  ratesWithSharedValue,
  SameQtyRateForAll,
  SameRateForAll,
  parseSharedQtyDraft,
  sanitizeQuoteRateInput,
} from '@/features/orders/quoteSameRate';
import {
  orderLineCantSupplyCue,
  orderLineLeftoverCue,
  quoteCantSupplyRowClass,
  quoteSheetItems,
} from '@/features/orders/quoteSheetItems';
import {
  Avatar,
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
import { COMPACT_QTY_INPUT_CLASS, COMPACT_SHEET_NUM_INPUT_CLASS, COMPACT_SHEET_RATE_INPUT_CLASS } from '@/ui/mobileOverflow';
import { compactQtyFieldLabelClass } from '@/ui/designLineChrome';
import {
  DispatchLinePreview,
  DispatchLineRemainder,
} from '@/features/orders/DispatchLinePreview';
import {
  SettleLinePreview,
  SettleLineRemainder,
} from '@/features/orders/SettleLinePreview';
import { DispatchLrBillInputs } from '@/features/orders/DispatchLrBillInputs';
import {
  BOTTOM_DOCK_CLEARANCE_CLASS,
  BottomTradeDock,
} from '@/features/browse/BottomTradeDock';
import { ORDER_QTY_SCOPE_ATTR, orderQtyInputProps } from '@/features/orders/orderQtyFocus';

/** Compact full-width dock / mill send. */
const COMPACT_SEND_CLASS = 'min-h-12 w-full px-3 text-sm';
/** Mill card Send / Decline — chip-sized, not a full-bleed bar. */
const MILL_CARD_ACTION_CLASS = '!min-h-8 h-8 w-auto px-3 text-meta';

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
        <span className="text-[10px] font-body text-muted">{qtyPrefix}</span>
      ) : null}
      <span className="text-sm font-emphasis">{amount}</span>
      {unit ? (
        <span className="text-[10px] font-body text-muted">{unit}</span>
      ) : null}
    </p>
  );
}

function rateAmount(rate: number | null): string {
  if (rate == null) return '';
  return `₹${rate.toLocaleString('en-IN')}`;
}

function rateUnitSuffix(
  unit: string | null,
  dispatchUnit?: string | null,
): string {
  const label = formatUnit(
    catalogRateDisplayUnit({ unit, dispatchUnit }) ?? unit,
  );
  return label ? `/${label}` : '';
}

function actionErrorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

function TimelineHeader({
  count,
  expanded,
  canExpand,
  onToggle,
}: {
  count: number;
  expanded: boolean;
  canExpand: boolean;
  onToggle: () => void;
}) {
  const label = `Timeline · ${count}`;
  if (!canExpand) {
    return (
      <p className="mb-2 text-xs font-body text-muted" data-testid="order-timeline-more">
        {label}
      </p>
    );
  }
  return (
    <button
      type="button"
      data-testid="order-timeline-more"
      aria-expanded={expanded}
      aria-label={expanded ? 'Hide timeline details' : 'Show timeline details'}
      className="mb-2 text-left text-xs font-body text-muted"
      onClick={onToggle}
    >
      {label}
    </button>
  );
}

function TimelineDot({ warning }: { warning: boolean }) {
  return (
    <span
      className={cx(
        'mt-1.5 h-[7px] w-[7px] shrink-0 rounded-full',
        warning ? 'bg-warning' : 'bg-accent',
      )}
    />
  );
}

function OrderTimeline({
  order,
  hidePriorQuotes = false,
  onOpenNotePhotos,
}: {
  order: OrderView;
  /** Buyer: one live quote + Edited. Seller keeps full quote history. */
  hidePriorQuotes?: boolean;
  onOpenNotePhotos?: (urls: string[], index: number, caption: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const toggle = () => setExpanded((v) => !v);
  const rawTrail = (order.trail ?? []).filter((step) => step.type !== OrderTrailType.Noted);
  if (rawTrail.length > 0) {
    const { events: trailAsc, quoteEditCount } = hidePriorQuotes
      ? collapseQuotedTrailEvents(rawTrail)
      : { events: rawTrail, quoteEditCount: 0 };
    const trail = newestFirstTrail(trailAsc);
    const { visible, hiddenCount } = timelineVisibleSlice(trail, expanded);
    const newest = trail[0];
    const newestHasExtras = Boolean(
      newest &&
        (newest.who ||
          newest.detail ||
          newest.note ||
          newest.noteVoiceUrl ||
          (newest.noteImageUrls?.length ?? 0) > 0 ||
          newest.at ||
          (hidePriorQuotes && newest.type === 'quoted' && quoteEditCount > 0)),
    );
    const canExpand = hiddenCount > 0 || newestHasExtras || expanded;
    return (
      <Card className="flex flex-col gap-0" data-testid="order-timeline">
        <TimelineHeader
          count={trail.length}
          expanded={expanded}
          canExpand={canExpand}
          onToggle={toggle}
        />
        <ol className="flex flex-col">
          {visible.map((step, index) => (
            <li key={step.id} className="flex gap-3">
              <div className="flex w-4 flex-col items-center">
                <TimelineDot warning={timelineUpdatedDot(step.type, step.summary)} />
              </div>
              <div className={cx('min-w-0 flex-1 pb-3', index === visible.length - 1 && 'pb-0')}>
                <div className="flex min-w-0 items-baseline justify-between gap-2">
                  <p className="min-w-0 text-sm font-emphasis text-ink">
                    {step.summary ?? step.type}
                  </p>
                  {step.at ? (
                    <p className="shrink-0 text-xs text-muted">{explorePostedWhen(step.at)}</p>
                  ) : null}
                </div>
                {expanded ? (
                  <>
                    {hidePriorQuotes && step.type === 'quoted' && quoteEditCount > 0 ? (
                      <p className="text-xs text-muted">
                        Edited
                        {quoteEditCount > 1 ? ` · ${quoteEditCount} times` : ''}
                      </p>
                    ) : null}
                    {step.who ? <p className="text-meta text-muted">{step.who}</p> : null}
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
                    {(step.noteImageUrls?.length ?? 0) > 0 ? (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {step.noteImageUrls!.map((url, photoIndex) => (
                          <button
                            key={url}
                            type="button"
                            aria-label="View note photo"
                            className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-foam"
                            onClick={() =>
                              onOpenNotePhotos?.(
                                step.noteImageUrls!,
                                photoIndex,
                                step.summary ?? 'Note',
                              )
                            }
                          >
                            <ManagedImage
                              src={toAbsoluteMediaUrl(url)}
                              alt=""
                              variant={MEDIA_VARIANT.Thumbnail1}
                              className="h-full w-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </Card>
    );
  }

  const stepsAsc = buildOrderTimelineSteps({
    ...order,
    returns: order.returns ?? [],
    staff: order.timelineStaff,
  });
  const steps = newestFirstTrail(stepsAsc);
  const { visible, hiddenCount } = timelineVisibleSlice(steps, expanded);
  const amended =
    order.amendCount > 0 ||
    (order.status === 'requested' &&
      new Date(order.updatedAt).getTime() - new Date(order.createdAt).getTime() > 2000);
  const newest = steps[0];
  const newestHasExtras = Boolean(
    newest && (newest.at || newest.staffLine || newest.detail || (newest.key === 'requested' && amended)),
  );
  const canExpand = hiddenCount > 0 || newestHasExtras || expanded;

  return (
    <Card className="flex flex-col gap-0" data-testid="order-timeline">
      <TimelineHeader
        count={steps.length}
        expanded={expanded}
        canExpand={canExpand}
        onToggle={toggle}
      />
      <ol className="flex flex-col">
        {visible.map((step, index) => (
          <li key={step.key} className="flex gap-3">
            <div className="flex w-4 flex-col items-center">
              <TimelineDot warning={timelineUpdatedDot(undefined, step.label)} />
            </div>
            <div className={cx('min-w-0 flex-1 pb-3', index === visible.length - 1 && 'pb-0')}>
              <div className="flex min-w-0 items-baseline justify-between gap-2">
                <p
                  className={cx(
                    'min-w-0 text-sm font-emphasis',
                    step.done || step.current ? 'text-ink' : 'text-muted',
                  )}
                >
                  {step.label}
                </p>
                {step.at ? (
                  <p className="shrink-0 text-xs text-muted">{explorePostedWhen(step.at)}</p>
                ) : null}
              </div>
              {expanded ? (
                <>
                  {step.staffLine ? (
                    <p className="text-meta text-muted">{step.staffLine}</p>
                  ) : null}
                  {step.detail ? <p className="text-xs text-muted">{step.detail}</p> : null}
                  {step.key === 'requested' && amended ? (
                    <p className="text-xs text-muted">
                      Updated
                      {order.amendCount > 1 ? ` · ${order.amendCount} times` : ''} ·{' '}
                      {explorePostedWhen(order.updatedAt)}
                    </p>
                  ) : null}
                </>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function PartyShopName({ name, href }: { name: string; href: string | null }) {
  return href ? (
    <Link to={href} data-testid="order-party-profile" className="font-emphasis text-accent">
      {name}
    </Link>
  ) : (
    <span className="font-emphasis text-ink">{name}</span>
  );
}

function noteAttachPayload(note: string, voice: NoteVoiceValue, images: string[]) {
  return {
    note: note.trim() || undefined,
    noteVoiceMediaId: voice?.mediaId,
    noteVoiceDurationMs: voice?.durationMs,
    noteImageUrls: images.length > 0 ? images : undefined,
  };
}

function OrderLinePhoto({
  item,
  items,
  onOpen,
  size = 'lg',
}: {
  item: OrderItemView;
  items: OrderItemView[];
  onOpen: (index: number) => void;
  /** lg = 48px sheets; ticket = proto 42×4/5; md/sm for tight chrome only. */
  size?: 'lg' | 'md' | 'sm' | 'ticket';
}) {
  const raw = urlsForOrderItem(item)[0];
  const url = raw ? toAbsoluteMediaUrl(raw) : '';
  const box =
    size === 'ticket'
      ? 'h-[52.5px] w-[42px] min-h-[52.5px] min-w-[42px] shrink-0 rounded-md'
      : size === 'sm'
        ? 'h-[3.15rem] w-[3.15rem] min-h-[3.15rem] min-w-[3.15rem] shrink-0 rounded-lg'
        : size === 'md'
          ? 'h-[3.675rem] w-[3.675rem] min-h-[3.675rem] min-w-[3.675rem] shrink-0 rounded-xl'
          : 'h-12 w-12 min-h-12 min-w-12 shrink-0 rounded-lg';
  if (!url) {
    return (
      <div
        data-testid="order-line-photo"
        data-empty="true"
        className={cx(
          'flex items-center justify-center bg-foam text-muted',
          box,
          size === 'sm' ? 'text-sm font-emphasis' : 'text-base font-emphasis',
        )}
        aria-hidden
      >
        {item.name.charAt(0)}
      </div>
    );
  }
  return (
    <button
      type="button"
      data-testid="order-line-photo"
      className={cx('overflow-hidden bg-foam', box)}
      aria-label={`View photo for ${item.name}`}
      onClick={(event) => {
        event.stopPropagation();
        onOpen(galleryIndexForItem(items, item.id));
      }}
    >
      <ManagedImage src={url} alt="" variant={MEDIA_VARIANT.Thumbnail1} className="h-full w-full object-cover" />
    </button>
  );
}

function OrderLineCantSupplyFace({
  item,
  items,
  cantSupply,
  onOpen,
  size = 'lg',
  children,
  className,
  soldAs = true,
  ticketLayout = false,
}: {
  item: OrderItemView;
  items: OrderItemView[];
  cantSupply: boolean;
  onOpen: (index: number) => void;
  size?: 'lg' | 'md' | 'sm' | 'ticket';
  children?: ReactNode;
  className?: string;
  /** Mill Send qty is a bare number — keep per mtr. Ticket Total carries the unit. */
  soldAs?: boolean;
  /** Prototype ticket line: rate on the name, qty under — no Price · Bill extra. */
  ticketLayout?: boolean;
}) {
  const leftover = orderLineLeftoverCue(item);
  const faded = cantSupply || Boolean(leftover);
  const cue = orderLineCantSupplyCue(cantSupply);
  const identity = soldAs ? orderLineIdentitySecondary(item) : null;
  return (
    <OrderLineStack
      className={className}
      muted={faded}
      photo={
        <OrderLinePhoto
          item={item}
          items={items}
          onOpen={onOpen}
          size={ticketLayout ? 'ticket' : size}
        />
      }
      title={
        <OrderDesignTitle
          name={item.name}
          muted={faded}
          rate={ticketLayout ? orderTicketLineRateCopy(item) : undefined}
          extra={ticketLayout ? undefined : <OrderLineMoneyLine item={item} />}
        />
      }
      secondary={
        identity ? (
          <p className="mt-0.5 truncate text-[12px] font-body text-muted" data-testid="order-line-identity">
            {identity}
          </p>
        ) : null
      }
      cues={
        <>
          {leftover ? (
            <p
              className="text-xs font-emphasis text-ink"
              data-testid="order-line-no-longer-available"
            >
              {leftover}
            </p>
          ) : null}
          {cue ? (
            <p className="text-xs font-emphasis text-ink" data-testid="order-line-cant-supply-cue">
              {cue}
            </p>
          ) : null}
          {item.note ? <OrderLineNoteCue note={item.note} /> : null}
        </>
      }
      facts={children}
    />
  );
}

export function OrderDetailPage() {
  const { id = '' } = useParams();
  const companyId = useCompanyId();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const onOrderBack = () => navigateBackOr(navigate, location.key, '/orders');
  const { showToast } = useToast();
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);
  const [linesOpen, setLinesOpen] = useState(false);
  const [amendOpen, setAmendOpen] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [changeQty, setChangeQty] = useState<Record<string, string>>({});
  const [changeRate, setChangeRate] = useState<Record<string, string>>({});
  const [amendQty, setAmendQty] = useState<Record<string, string>>({});
  const [amendRemoved, setAmendRemoved] = useState<Set<string>>(() => new Set());
  const [amendTransporter, setAmendTransporter] = useState('');
  const [dispatch, setDispatch] = useState<{
    transporter?: string;
    parcelCount?: number;
    legs: DispatchLegDraft[];
  }>({ legs: [emptyDispatchLeg()] });
  const [shipQty, setShipQty] = useState<Record<string, string>>({});
  const [shipOn, setShipOn] = useState<Record<string, boolean>>({});
  /** Inline expand of an earlier LR — separate from new-dispatch draft. */
  const [editingShipmentId, setEditingShipmentId] = useState<string | null>(null);
  const [priorListOpen, setPriorListOpen] = useState(false);
  const [editShipQty, setEditShipQty] = useState<Record<string, string>>({});
  const [editShipOn, setEditShipOn] = useState<Record<string, boolean>>({});
  const [editDispatch, setEditDispatch] = useState<{
    transporter?: string;
    parcelCount?: number;
    legs: DispatchLegDraft[];
  }>({ legs: [emptyDispatchLeg()] });
  const [expandedLineId, setExpandedLineId] = useState<string | null>(null);
  const [lineFulfillError, setLineFulfillError] = useState<string | null>(null);
  const [packingSlipShipmentId, setPackingSlipShipmentId] = useState<string | null>(null);
  const [packingSlipOpts, setPackingSlipOpts] = useState<Required<PackingSlipOptions>>({
    showBuyer: true,
    showPhotos: true,
  });
  const [packingSlipBusy, setPackingSlipBusy] = useState(false);
  const [orderFormOpen, setOrderFormOpen] = useState(false);
  const [orderFormShowPhotos, setOrderFormShowPhotos] = useState(true);
  const [orderFormBusy, setOrderFormBusy] = useState(false);
  const [dispatchNote, setDispatchNote] = useState('');
  const [dispatchNoteVoice, setDispatchNoteVoice] = useState<NoteVoiceValue>(null);
  const [dispatchNoteImages, setDispatchNoteImages] = useState<string[]>([]);
  const [amendNote, setAmendNote] = useState('');
  const [amendNoteVoice, setAmendNoteVoice] = useState<NoteVoiceValue>(null);
  const [amendNoteImages, setAmendNoteImages] = useState<string[]>([]);
  const [amendLineNotes, setAmendLineNotes] = useState<Record<string, string>>({});
  const [linesNote, setLinesNote] = useState('');
  const [linesNoteVoice, setLinesNoteVoice] = useState<NoteVoiceValue>(null);
  const [linesNoteImages, setLinesNoteImages] = useState<string[]>([]);
  const [linesManualOrderNo, setLinesManualOrderNo] = useState('');
  const [linesManualImages, setLinesManualImages] = useState<string[]>([]);
  const [linesPersonalNote, setLinesPersonalNote] = useState('');
  const [linesPersonalNoteVoice, setLinesPersonalNoteVoice] = useState<NoteVoiceValue>(null);
  const [linesPersonalNoteImages, setLinesPersonalNoteImages] = useState<string[]>([]);
  const [actionNoteOpen, setActionNoteOpen] = useState<'cancel' | 'decline' | null>(null);
  const [millDeclineDesk, setMillDeclineDesk] = useState<
    { all: true } | { all?: false; upstreamOrderId: string; sellerName: string } | null
  >(null);
  const [actionNote, setActionNote] = useState('');
  const [actionNoteVoice, setActionNoteVoice] = useState<NoteVoiceValue>(null);
  const [actionNoteImages, setActionNoteImages] = useState<string[]>([]);
  const [settleNote, setSettleNote] = useState('');
  const [settleNoteVoice, setSettleNoteVoice] = useState<NoteVoiceValue>(null);
  const [settleNoteImages, setSettleNoteImages] = useState<string[]>([]);
  const [settleQty, setSettleQty] = useState<Record<string, string>>({});
  const [manualRefOpen, setManualRefOpen] = useState(false);
  const [manualOrderNo, setManualOrderNo] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [manualImages, setManualImages] = useState<string[]>([]);
  const [personalNoteOpen, setPersonalNoteOpen] = useState(false);
  const [personalNote, setPersonalNote] = useState('');
  const [personalNoteVoice, setPersonalNoteVoice] = useState<NoteVoiceValue>(null);
  const [personalNoteImages, setPersonalNoteImages] = useState<string[]>([]);
  const [sharedMillRate, setSharedMillRate] = useState('');
  const [millSameOpen, setMillSameOpen] = useState(false);
  const [millSameDraft, setMillSameDraft] = useState('');
  const [millRateDefaults, setMillRateDefaults] = useState<Record<string, string>>({});
  const [lineActions, setLineActions] = useState<Record<string, 'confirm' | 'decline'>>({});
  const [lineConfirmQty, setLineConfirmQty] = useState<Record<string, string>>({});
  const [lineConfirmRates, setLineConfirmRates] = useState<Record<string, string>>({});
  const [linesSameOpen, setLinesSameOpen] = useState(false);
  const [linesSameQtyDraft, setLinesSameQtyDraft] = useState('');
  const [linesSameRateDraft, setLinesSameRateDraft] = useState('');
  const [sharedConfirmQty, setSharedConfirmQty] = useState<number | null>(null);
  const [sharedConfirmRate, setSharedConfirmRate] = useState('');
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoViewerIndex, setPhotoViewerIndex] = useState(0);
  /** When set, PhotoViewer shows these URLs instead of order-line gallery. */
  const [noteViewerUrls, setNoteViewerUrls] = useState<string[] | null>(null);
  const [noteViewerCaption, setNoteViewerCaption] = useState<string | null>(null);
  const [orderMenuOpen, setOrderMenuOpen] = useState(false);
  const [complaintAgainstOpen, setComplaintAgainstOpen] = useState(false);
  const [complaintTargets, setComplaintTargets] = useState<ComplaintAgainstTarget[]>([]);
  const [ticketNote, setTicketNote] = useState('');
  const [ticketNoteVoice, setTicketNoteVoice] = useState<NoteVoiceValue>(null);
  const [ticketNoteImages, setTicketNoteImages] = useState<string[]>([]);
  const [ticketNoteError, setTicketNoteError] = useState<string | null>(null);
  const [forwardNoteId, setForwardNoteId] = useState<string | null>(null);
  const [millPickOpen, setMillPickOpen] = useState(false);

  const order = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get<OrderView>(`/orders/${id}`),
  });

  const complaints = useQuery({
    queryKey: ['complaints'],
    queryFn: () => api.get<CursorPage<ComplaintView>>('/complaints', { limit: 50 }),
  });

  const openOrderComplaints = useMemo(() => {
    if (!id) return [];
    return (complaints.data?.results ?? []).filter(
      (row) =>
        row.orderId === id &&
        (row.status === 'open' || row.status === 'responded'),
    );
  }, [complaints.data?.results, id]);

  useEffect(() => {
    const desk = order.data?.deskOrderId;
    if (!desk || desk === id) return;
    navigate(`/orders/${desk}`, { replace: true });
  }, [order.data?.deskOrderId, id, navigate]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['order', id] });
    void queryClient.invalidateQueries({ queryKey: ['orders'] });
    void queryClient.invalidateQueries({ queryKey: ['complaints'] });
    void queryClient.invalidateQueries({ queryKey: ['threads'] });
    const threadId = order.data?.threadId;
    if (threadId) {
      void queryClient.invalidateQueries({ queryKey: ['thread', threadId, 'messages'] });
    }
  };

  const addTicketNote = useMutation({
    mutationFn: () =>
      api.post<OrderView>(`/orders/${id}/notes`, noteAttachPayload(ticketNote, ticketNoteVoice, ticketNoteImages)),
    onSuccess: () => {
      setTicketNote('');
      setTicketNoteVoice(null);
      setTicketNoteImages([]);
      setTicketNoteError(null);
      refresh();
    },
    onError: (err) => setTicketNoteError(actionErrorMessage(err, 'Could not add note.')),
  });

  const forwardTicketNote = useMutation({
    mutationFn: ({ noteId, millOrderId }: { noteId: string; millOrderId?: string }) =>
      api.post<OrderView>(
        `/orders/${id}/notes/${encodeURIComponent(noteId)}/forward`,
        millOrderId ? { millOrderId } : {},
      ),
    onSuccess: () => {
      setForwardNoteId(null);
      setMillPickOpen(false);
      setTicketNoteError(null);
      refresh();
    },
    onError: (err) => setTicketNoteError(actionErrorMessage(err, 'Could not forward note.')),
  });

  const resolveComplaint = useMutation({
    mutationFn: (complaintId: string) => api.post(`/complaints/${complaintId}/resolve`, {}),
    onSuccess: () => {
      refresh();
      showToast('Complaint resolved.');
    },
    onError: (err) =>
      showToast(err instanceof ApiError ? err.message : 'Could not resolve complaint.', 'danger'),
  });

  const act = useMutation({
    mutationFn: (action: string) => api.post<OrderView>(`/orders/${id}/${action}`, {}),
    onSuccess: refresh,
    onError: (err) => showToast(actionErrorMessage(err, 'Action failed.'), 'danger'),
  });

  const actionWithNote = useMutation({
    mutationFn: () => {
      const action = actionNoteOpen;
      if (!action) throw new Error('No action');
      return api.post<OrderView>(
        `/orders/${id}/${action}`,
        noteAttachPayload(actionNote, actionNoteVoice, actionNoteImages),
      );
    },
    onSuccess: () => {
      setActionNoteOpen(null);
      setActionNote('');
      setActionNoteVoice(null);
      setActionNoteImages([]);
      refresh();
    },
    onError: (err) => showToast(actionErrorMessage(err, 'Action failed.'), 'danger'),
  });

  const sendUp = useMutation({
    mutationFn: (body: SendUpOrderDto) => api.post<OrderView>(`/orders/${id}/send-up`, body),
    onSuccess: (_view, vars) => {
      setChangeOpen(false);
      refresh();
      showToast(vars.upstreamOrderId ? 'Sent.' : 'Sent to waiting mills');
    },
    onError: (err) => showToast(actionErrorMessage(err, 'Could not send.'), 'danger'),
  });

  const millDecline = useMutation({
    mutationFn: (body: { upstreamOrderId?: string }) =>
      api.post<OrderView>(`/orders/${id}/mill-decline`, body),
    onSuccess: (_view, vars) => {
      setMillDeclineDesk(null);
      refresh();
      showToast(vars.upstreamOrderId ? 'Mill declined' : 'Waiting mills declined');
    },
    onError: (err) => showToast(actionErrorMessage(err, 'Could not decline this mill.'), 'danger'),
  });

  const millHold = useMutation({
    mutationFn: (body: { upstreamOrderId: string; held: boolean }) =>
      api.post<OrderView>(`/orders/${id}/mill-hold`, body),
    onSuccess: refresh,
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
    setMillSameOpen(false);
    setMillSameDraft('');
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

  const openAmendSheet = () => {
    const items = order.data?.items ?? [];
    const qty: Record<string, string> = {};
    const notes: Record<string, string> = {};
    for (const item of items) {
      if (item.productId) {
        qty[item.productId] = String(item.quantity);
        notes[item.productId] = item.note ?? '';
      }
    }
    setAmendQty(qty);
    setAmendLineNotes(notes);
    setAmendRemoved(new Set());
    setAmendTransporter(order.data?.transporter?.trim() ?? '');
    setSheetError(null);
    setAmendOpen(true);
  };

  const amendOrder = useMutation({
    mutationFn: () => {
      const items = (order.data?.items ?? [])
        .filter((item) => item.productId && !amendRemoved.has(item.productId))
        .map((item) => {
          const pid = item.productId!;
          const lineNote = (amendLineNotes[pid] ?? item.note ?? '').trim();
          return {
            productId: pid,
            quantity: Number(amendQty[pid] || item.quantity),
            images: [] as string[],
            ...(lineNote ? { note: lineNote } : {}),
          };
        })
        .filter((line) => line.quantity > 0);
      if (items.length < 1) {
        throw new ApiError({
          statusCode: 400,
          code: 'EMPTY_AMEND',
          message: 'Keep at least one design.',
        });
      }
      const trimmedTransporter = amendTransporter.trim();
      if (trimmedTransporter && order.data?.sellerCompanyId) {
        rememberTransporter(trimmedTransporter, order.data.sellerCompanyId);
      }
      return api.post<OrderView>(`/orders/${id}/amend`, {
        items,
        transporter: trimmedTransporter || null,
        ...noteAttachPayload(amendNote, amendNoteVoice, amendNoteImages),
      });
    },
    onSuccess: () => {
      setAmendOpen(false);
      setAmendNote('');
      setAmendNoteVoice(null);
      setAmendNoteImages([]);
      setAmendTransporter('');
      setSheetError(null);
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      refresh();
    },
    onError: (err) => setSheetError(actionErrorMessage(err, 'Could not update.')),
  });

  const dispatchLines = useMemo(
    () => ticketDisplayItems(fulfillDispatchItems(order.data?.items ?? [])),
    [order.data?.items],
  );

  const declinedDispatchItems = useMemo(
    () => ticketDisplayItems(cantSupplyDispatchItems(order.data?.items ?? [])),
    [order.data?.items],
  );

  const dispatchTally = useMemo(
    () => dispatchThisLrTally(dispatchLines, shipOn, shipQty),
    [dispatchLines, shipOn, shipQty],
  );
  const dispatchThisLrSummary = useMemo(
    () => dispatchThisLrFooterSummary(dispatchLines, shipOn, shipQty),
    [dispatchLines, shipOn, shipQty],
  );
  const settleLines = useMemo(
    () => ticketDisplayItems(settleSheetItems(order.data?.items ?? [])),
    [order.data?.items],
  );
  const settleLeftoverSummary = useMemo(
    () => settleLeftoverFooterSummary(settleLines, settleQty),
    [settleLines, settleQty],
  );
  const lastSettleId = lastGroupedItem(settleLines, (row) => row.unit)?.id;

  const priorShipments = order.data?.shipments ?? [];
  const priorListShown = priorListOpen || Boolean(editingShipmentId);

  const dispatchOrder = useMutation({
    mutationFn: () => {
      const legs = dispatch.legs.map((leg) => ({
        lrNumber: leg.lrNumber.trim() || undefined,
        billNumber: leg.billNumber.trim() || undefined,
        imageUrls: (leg.imageUrls?.length ?? 0) > 0 ? leg.imageUrls : undefined,
      }));
      const lrNumber = legs.find((leg) => leg.lrNumber)?.lrNumber;
      const items = dispatchPayloadLines(dispatchLines, shipOn, shipQty);
      if (items.length < 1) {
        throw new ApiError({
          statusCode: 400,
          code: 'NOTHING_TO_SHIP',
          message: 'Turn on at least one design for this LR.',
        });
      }
      const trimmedTransporter = dispatch.transporter?.trim() || undefined;
      if (trimmedTransporter && order.data?.sellerCompanyId) {
        rememberTransporter(trimmedTransporter, order.data.sellerCompanyId);
      }
      const dto: DispatchDto = {
        lrNumber,
        transporter: trimmedTransporter,
        parcelCount: dispatch.legs.length,
        legs,
        items,
        ...noteAttachPayload(dispatchNote, dispatchNoteVoice, dispatchNoteImages),
      };
      return api.post<OrderView>(`/orders/${id}/dispatch`, dto);
    },
    onSuccess: () => {
      setDispatchOpen(false);
      setEditingShipmentId(null);
      setDispatchError(null);
      setDispatchNote('');
      setDispatchNoteVoice(null);
      refresh();
      showToast('Dispatched.');
    },
    onError: (err) =>
      setDispatchError(actionErrorMessage(err, 'Could not dispatch.')),
  });

  const editShipment = useMutation({
    mutationFn: () => {
      if (!editingShipmentId || !order.data) {
        throw new ApiError({
          statusCode: 400,
          code: 'INVALID',
          message: 'No shipment to edit.',
        });
      }
      const items = Object.entries(editShipOn)
        .filter(([, on]) => on)
        .map(([orderItemId]) => ({
          orderItemId,
          quantity: Math.max(0, Number(editShipQty[orderItemId] ?? 0) || 0),
        }))
        .filter((line) => line.quantity > 0);
      if (items.length < 1) {
        throw new ApiError({
          statusCode: 400,
          code: 'NOTHING_TO_SHIP',
          message: 'Keep at least one design on this LR.',
        });
      }
      const legs = editDispatch.legs.map((leg) => ({
        lrNumber: leg.lrNumber.trim() || null,
        billNumber: leg.billNumber.trim() || null,
        imageUrls: leg.imageUrls ?? [],
      }));
      const trimmedTransporter = editDispatch.transporter?.trim() || null;
      if (trimmedTransporter && order.data?.sellerCompanyId) {
        rememberTransporter(trimmedTransporter, order.data.sellerCompanyId);
      }
      const dto: EditShipmentDto = {
        lrNumber: legs.find((leg) => leg.lrNumber)?.lrNumber ?? null,
        transporter: trimmedTransporter,
        parcelCount: editDispatch.legs.length,
        legs,
        items,
      };
      return api.patch<OrderView>(`/orders/${id}/shipments/${editingShipmentId}`, dto);
    },
    onSuccess: () => {
      setEditingShipmentId(null);
      setDispatchError(null);
      refresh();
      showToast('Dispatch updated.');
    },
    onError: (err) =>
      setDispatchError(actionErrorMessage(err, 'Could not update dispatch.')),
  });

  const setLineSupply = useMutation({
    mutationFn: (payload: { orderItemId: string; cantSupply: boolean }) =>
      api.post<OrderView>(`/orders/${id}/lines/supply`, {
        items: [payload],
      }),
    onSuccess: (updated, vars) => {
      setLineFulfillError(null);
      if (!vars.cantSupply) {
        const restored = updated.items.find((row) => row.id === vars.orderItemId);
        if (restored && (restored.remainingQuantity ?? 0) > 0) {
          setShipOn((prev) => ({ ...prev, [restored.id]: true }));
          setShipQty((prev) => ({
            ...prev,
            [restored.id]: String(restored.remainingQuantity),
          }));
        }
      }
      queryClient.setQueryData(['order', id], updated);
      refresh();
      showToast('Updated.');
    },
    onError: (err) =>
      setLineFulfillError(actionErrorMessage(err, 'Could not update Can’t supply.')),
  });

  const saveLineQty = useMutation({
    mutationFn: (payload: { orderItemId: string; quantity: number }) =>
      api.post<OrderView>(`/orders/${id}/lines/quantity`, {
        items: [payload],
      }),
    onSuccess: () => {
      setLineFulfillError(null);
      refresh();
      showToast('Updated.');
    },
    onError: (err) =>
      setLineFulfillError(actionErrorMessage(err, 'Could not update quantity.')),
  });

  const submitDispatch = () => {
    setDispatchError(null);
    if (dispatchPayloadLines(dispatchLines, shipOn, shipQty).length < 1) {
      setDispatchError('Turn on at least one design for this LR.');
      return;
    }
    dispatchOrder.mutate();
  };

  const submitEditShipment = () => {
    setDispatchError(null);
    const kept = Object.entries(editShipOn).filter(([, on]) => on).length;
    if (kept < 1) {
      setDispatchError('Keep at least one design on this LR.');
      return;
    }
    editShipment.mutate();
  };

  const loadShipmentIntoEdit = (shipment: OrderView['shipments'][number]) => {
    if (!order.data || order.data.status === 'settled') return;
    const on: Record<string, boolean> = {};
    const qty: Record<string, string> = {};
    for (const item of order.data.items) {
      const line = shipment.items.find((row) => row.orderItemId === item.id);
      if (line && line.quantity > 0) {
        on[item.id] = true;
        qty[item.id] = String(line.quantity);
      }
    }
    setEditingShipmentId(shipment.id);
    setEditShipOn(on);
    setEditShipQty(qty);
    const legs = seedDispatchLegsFromShipment(shipment);
    setEditDispatch({
      transporter: shipment.transporter ?? undefined,
      parcelCount: shipment.parcelCount ?? legs.length,
      legs,
    });
    setDispatchError(null);
  };

  const togglePriorShipmentEdit = (shipment: OrderView['shipments'][number]) => {
    if (editingShipmentId === shipment.id) {
      setEditingShipmentId(null);
      setDispatchError(null);
      return;
    }
    setPriorListOpen(true);
    loadShipmentIntoEdit(shipment);
  };

  const packingSlipShipment =
    order.data?.shipments.find((row) => row.id === packingSlipShipmentId) ?? null;

  const openPackingSlipSheet = (shipment: OrderView['shipments'][number]) => {
    setPackingSlipOpts({ showBuyer: true, showPhotos: true });
    setPackingSlipShipmentId(shipment.id);
  };

  const buildPackingSlipFile = async () => {
    if (!order.data || !packingSlipShipment) return null;
    const input = {
      orderId: order.data.id,
      counterpartName: order.data.counterpart.name,
      shipment: packingSlipShipment,
      note: order.data.note,
      orderItems: order.data.items,
      options: packingSlipOpts,
    };
    const bytes = await packingSlipPdfBytes(input);
    return new File([Uint8Array.from(bytes)], packingSlipFileName(input), {
      type: 'application/pdf',
    });
  };

  const runPackingSlip = async (mode: 'open' | 'share') => {
    setPackingSlipBusy(true);
    try {
      const file = await buildPackingSlipFile();
      if (!file) return;
      if (mode === 'open') openPackingSlipPdf(file);
      else await shareOrDownloadPdf(file);
      setPackingSlipShipmentId(null);
    } catch {
      showToast(mode === 'open' ? 'Could not open PDF.' : 'Could not share PDF.', 'danger');
    } finally {
      setPackingSlipBusy(false);
    }
  };

  const openOrderFormSheet = () => {
    setOrderMenuOpen(false);
    setOrderFormShowPhotos(true);
    setOrderFormOpen(true);
  };

  const buildOrderFormFile = async () => {
    if (!order.data) return null;
    const input = {
      orderId: order.data.id,
      intent: order.data.intent,
      createdAt: order.data.createdAt,
      sellerName: order.data.sellerName,
      buyerName: order.data.buyerName,
      manualOrderNo: order.data.manualRef?.manualOrderNo ?? null,
      note: order.data.note,
      items: order.data.items,
      options: { showPhotos: orderFormShowPhotos },
    };
    const bytes = await orderFormPdfBytes(input);
    return new File([Uint8Array.from(bytes)], orderFormFileName(input), {
      type: 'application/pdf',
    });
  };

  const runOrderForm = async (mode: 'open' | 'share') => {
    setOrderFormBusy(true);
    try {
      const file = await buildOrderFormFile();
      if (!file) return;
      if (mode === 'open') openPackingSlipPdf(file);
      else await shareOrDownloadPdf(file);
      setOrderFormOpen(false);
    } catch {
      showToast(mode === 'open' ? 'Could not open PDF.' : 'Could not share PDF.', 'danger');
    } finally {
      setOrderFormBusy(false);
    }
  };

  const settleOrder = useMutation({
    mutationFn: () => {
      const lines = settleSheetItems(order.data?.items ?? []);
      return api.post<OrderView>(`/orders/${id}/settle`, {
        ...noteAttachPayload(settleNote, settleNoteVoice, settleNoteImages),
        items: settlePayloadLines(lines, settleQty),
      });
    },
    onSuccess: (updated) => {
      setSettleOpen(false);
      setSettleNote('');
      setSettleNoteVoice(null);
      setSettleNoteImages([]);
      setSettleQty({});
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

  const saveManualRef = useMutation({
    mutationFn: () =>
      api.put<OrderView>(`/orders/${id}/manual-ref`, {
        manualOrderNo: manualOrderNo.trim() || null,
        note: manualNote.trim() || null,
        noteImageUrls: manualImages,
      }),
    onSuccess: (updated) => {
      setManualRefOpen(false);
      queryClient.setQueryData(['order', id], updated);
      showToast('Manual order no. saved');
    },
    onError: (err) => showToast(actionErrorMessage(err, 'Could not save.'), 'danger'),
  });

  const savePersonalNote = useMutation({
    mutationFn: () =>
      api.put<OrderView>(`/orders/${id}/personal-note`, {
        note: personalNote.trim() || null,
        noteVoiceMediaId: personalNoteVoice?.mediaId ?? null,
        noteVoiceDurationMs: personalNoteVoice?.durationMs ?? null,
        noteImageUrls: personalNoteImages,
      }),
    onSuccess: (updated) => {
      setPersonalNoteOpen(false);
      queryClient.setQueryData(['order', id], updated);
      showToast('Personal note saved');
    },
    onError: (err) => showToast(actionErrorMessage(err, 'Could not save.'), 'danger'),
  });

  const openManualRefSheet = () => {
    setOrderMenuOpen(false);
    const ref = order.data?.manualRef;
    setManualOrderNo(ref?.manualOrderNo ?? '');
    setManualNote(ref?.note ?? '');
    setManualImages(ref?.images ?? []);
    setManualRefOpen(true);
  };

  const openPersonalNoteSheet = () => {
    setOrderMenuOpen(false);
    const note = order.data?.personalNote;
    setPersonalNote(note?.note ?? '');
    setPersonalNoteVoice(
      note?.noteVoiceUrl && note.noteVoiceMediaId && note.noteVoiceDurationMs
        ? {
            mediaId: note.noteVoiceMediaId,
            url: toAbsoluteMediaUrl(note.noteVoiceUrl),
            durationMs: note.noteVoiceDurationMs,
          }
        : null,
    );
    setPersonalNoteImages(note?.images ?? []);
    setPersonalNoteOpen(true);
  };

  const decideLines = useMutation({
    mutationFn: (verb: 'confirm' | 'decline') => {
      const open = ticketDisplayItems(
        (order.data?.items ?? []).filter((item) => item.lineStatus === 'open'),
      );
      const ids = open.map((item) => item.id);
      const lineQtyById: Record<string, number> = {};
      for (const item of open) lineQtyById[item.id] = item.quantity;
      const dto: DecideOrderLinesDto = {
        items: decideLinesPayload(
          ids,
          lineActions,
          verb,
          lineConfirmQty,
          lineQtyById,
          lineConfirmRates,
          quoteRateNumber,
        ),
        ...noteAttachPayload(linesNote, linesNoteVoice, linesNoteImages),
        ...decideLinesConfirmExtras(verb, {
          manualOrderNo: linesManualOrderNo,
          manualImages: linesManualImages,
          personalNote: linesPersonalNote,
          personalVoiceMediaId: linesPersonalNoteVoice?.mediaId,
          personalVoiceDurationMs: linesPersonalNoteVoice?.durationMs,
          personalImages: linesPersonalNoteImages,
        }),
      };
      return api.post<OrderView>(`/orders/${id}/lines/decide`, dto);
    },
    onSuccess: () => {
      setLinesOpen(false);
      setLinesNote('');
      setLinesNoteVoice(null);
      setLinesNoteImages([]);
      setLinesManualOrderNo('');
      setLinesManualImages([]);
      setLinesPersonalNote('');
      setLinesPersonalNoteVoice(null);
      setLinesPersonalNoteImages([]);
      setLineConfirmQty({});
      setLineConfirmRates({});
      setSharedConfirmQty(null);
      setSharedConfirmRate('');
      setLinesSameOpen(false);
      setSheetError(null);
      refresh();
    },
    onError: (err) => setSheetError(actionErrorMessage(err, 'Could not update lines.')),
  });


  const openLinesSheet = () => {
    const open = ticketDisplayItems(
      (order.data?.items ?? []).filter((item) => item.lineStatus === 'open'),
    );
    const ids = open.map((item) => item.id);
    const qty: Record<string, string> = {};
    const rateDefaults: Record<string, string> = {};
    for (const item of open) {
      qty[item.id] = String(item.quantity);
      rateDefaults[item.id] = item.rate != null ? String(item.rate) : '';
    }
    setLineActions(defaultLineActions(ids));
    setLineConfirmQty(qty);
    setLineConfirmRates(rateDefaults);
    setSharedConfirmQty(null);
    setSharedConfirmRate('');
    setLinesSameOpen(false);
    setLinesSameQtyDraft('');
    setLinesSameRateDraft('');
    setSheetError(null);
    const ref = order.data?.manualRef;
    setLinesManualOrderNo(ref?.manualOrderNo ?? '');
    setLinesManualImages(ref?.images ?? []);
    const personal = order.data?.personalNote;
    setLinesPersonalNote(personal?.note ?? '');
    setLinesPersonalNoteVoice(
      personal?.noteVoiceUrl && personal.noteVoiceMediaId && personal.noteVoiceDurationMs
        ? {
            mediaId: personal.noteVoiceMediaId,
            url: toAbsoluteMediaUrl(personal.noteVoiceUrl),
            durationMs: personal.noteVoiceDurationMs,
          }
        : null,
    );
    setLinesPersonalNoteImages(personal?.images ?? []);
    setLinesNote('');
    setLinesNoteVoice(null);
    setLinesNoteImages([]);
    setLinesOpen(true);
  };

  const openComplaintFromOrder = async () => {
    if (!order.data || !companyId) return;
    setOrderMenuOpen(false);
    const targets = complaintAgainstTargets(order.data, companyId);
    if (targets.length === 0) {
      showToast('No shop to complain about on this order.');
      return;
    }
    if (targets.length === 1) {
      await goComplaintAgainst(targets[0]!);
      return;
    }
    setComplaintTargets(targets);
    setComplaintAgainstOpen(true);
  };

  const goComplaintAgainst = async (target: ComplaintAgainstTarget) => {
    setComplaintAgainstOpen(false);
    try {
      const thread = await api.post<{ id: string }>('/threads/direct', {
        companyId: target.companyId,
      });
      navigate(
        `/chats/${thread.id}?complaint=1&order=${encodeURIComponent(target.orderId)}`,
      );
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Could not open chat.');
    }
  };

  const openDispatchSheet = () => {
    const lines = fulfillDispatchItems(order.data?.items ?? []);
    setEditingShipmentId(null);
    setPriorListOpen(false);
    setShipOn(defaultDispatchOn(lines));
    setShipQty(defaultDispatchQty(lines));
    setDispatch({
      legs: [emptyDispatchLeg()],
      transporter: dispatchTransporterPrefill(order.data?.transporter),
    });
    setDispatchNote('');
    setDispatchNoteVoice(null);
    setDispatchError(null);
    setDispatchOpen(true);
  };

  const openEditShipment = (shipment: OrderView['shipments'][number]) => {
    if (!order.data || order.data.status === 'settled') return;
    // Keep new-dispatch draft; open sheet and expand this earlier LR inline.
    if (!dispatchOpen) {
      const lines = fulfillDispatchItems(order.data.items);
      setShipOn(defaultDispatchOn(lines));
      setShipQty(defaultDispatchQty(lines));
      setDispatch({
        legs: [emptyDispatchLeg()],
        transporter: dispatchTransporterPrefill(order.data.transporter),
      });
      setDispatchNote('');
      setDispatchNoteVoice(null);
      setDispatchOpen(true);
    }
    setPriorListOpen(true);
    loadShipmentIntoEdit(shipment);
  };

  const closeSheet = (
    which: 'lines' | 'dispatch' | 'settle' | 'amend',
  ) => {
    setSheetError(null);
    if (which === 'lines') setLinesOpen(false);
    if (which === 'dispatch') {
      setDispatchError(null);
      setEditingShipmentId(null);
      setDispatchOpen(false);
    }
    if (which === 'settle') setSettleOpen(false);
    if (which === 'amend') setAmendOpen(false);
  };

  const quoteItems = useMemo(
    () => ticketDisplayItems(quoteSheetItems(order.data?.items ?? [])),
    [order.data?.items],
  );

  const openItems = useMemo(
    () => quoteItems.filter((item) => item.lineStatus === 'open'),
    [quoteItems],
  );
  const openItemIds = useMemo(() => openItems.map((item) => item.id), [openItems]);
  const linesTally = useMemo(
    () => decideLinesTally(openItemIds, lineActions),
    [openItemIds, lineActions],
  );

  const linesConfirmReady = useMemo(() => {
    const lineQtyById: Record<string, number> = {};
    for (const item of openItems) lineQtyById[item.id] = item.quantity;
    return decideLinesConfirmReady(openItemIds, lineActions, lineConfirmQty, lineQtyById);
  }, [openItems, openItemIds, lineActions, lineConfirmQty]);

  const confirmRateDefaults = useMemo(() => {
    const next: Record<string, string> = {};
    for (const item of openItems) {
      next[item.id] = item.rate != null ? String(item.rate) : '';
    }
    return next;
  }, [openItems]);

  const confirmQtyDefaults = useMemo(() => {
    const next: Record<string, string> = {};
    for (const item of openItems) next[item.id] = String(item.quantity);
    return next;
  }, [openItems]);


  const actionDockKind = useMemo(() => {
    const data = order.data;
    if (!data) return 'none';
    const isSeller = actorSellsThisOrder(data.sellerCompanyId, companyId);
    const hasRemaining = data.items.some((item) => item.remainingQuantity > 0);
    const hasDeclinedToRestore = data.items.some(
      (item) => item.lineStatus === 'declined',
    );
    const openForDispatch =
      data.status === 'confirmed' || data.status === 'part_shipped';
    return orderActionDock({
      isSeller,
      status: data.status,
      millDesks: data.millDesks,
      sendQuote: false,
      hasSellerQuote: data.hasSellerQuote === true,
      canAmend: data.canAmend === true,
      canAcceptQuote: data.canAcceptQuote === true,
      createdBySeller: data.createdBySeller === true,
      openForDispatch,
      hasRemaining,
      hasDeclinedToRestore,
      canSettle: data.canSettle === true,
      partiallyShipped: data.partiallyShipped,
    }).kind;
  }, [order.data, companyId]);

  if (order.isLoading) {
    return <LoadingBlock label="Loading order…" />;
  }
  if (order.isError || !order.data) {
    return (
      <>
        <PageHeader title="Order" onBack={onOrderBack} />
        <ErrorState message="This order isn't available." />
      </>
    );
  }

  const data = order.data;
  const ticketItems = ticketDisplayItems(data.items);
  const lineGallery = orderItemGalleryUrls(data.items);
  const lineCaptions = orderItemGalleryCaptions(data.items);
  const lineDetails = orderItemGalleryDetails(data.items);
  const photoGallery = noteViewerUrls ?? lineGallery;
  const photoCaptions = noteViewerUrls
    ? noteViewerUrls.map(() => noteViewerCaption ?? 'Photo')
    : lineCaptions;
  const photoDetails = noteViewerUrls ? noteViewerUrls.map(() => '') : lineDetails;
  const openPhotoViewer = (index: number) => {
    setNoteViewerUrls(null);
    setNoteViewerCaption(null);
    setPhotoViewerIndex(index);
    setPhotoViewerOpen(true);
  };
  const openNotePhotos = (urls: string[], index: number, caption: string) => {
    const absolute = urls.map((url) => toAbsoluteMediaUrl(url)).filter(Boolean);
    if (absolute.length < 1) return;
    setNoteViewerUrls(absolute);
    setNoteViewerCaption(caption);
    setPhotoViewerIndex(Math.min(index, absolute.length - 1));
    setPhotoViewerOpen(true);
  };
  const isSeller = actorSellsThisOrder(data.sellerCompanyId, companyId);
  const isBuyer = data.direction === 'buying';
  const millSendPatches = (desk: (typeof data.millDesks)[number]) =>
    itemsForMill(data.items, desk)
      .map((item) => ({
        productId: item.productId ?? undefined,
        quantity: Number(millQty[item.id] ?? item.quantity),
        rate: quoteRateNumber(millRate[item.id]) ?? undefined,
      }))
      .filter((row) => row.productId);
  const hasRemaining = data.items.some((item) => item.remainingQuantity > 0);
  const hasDeclinedToRestore = data.items.some(
    (item) => item.lineStatus === 'declined',
  );
  const openForDispatch =
    data.status === 'confirmed' || data.status === 'part_shipped';
  const confirmOnFace = showSellerConfirmOnDesk(data.millDesks);
  const actionDock = orderActionDock({
    isSeller,
    status: data.status,
    millDesks: data.millDesks,
    sendQuote: false,
    hasSellerQuote: data.hasSellerQuote === true,
    canAmend: data.canAmend === true,
    canAcceptQuote: data.canAcceptQuote === true,
    createdBySeller: data.createdBySeller === true,
    openForDispatch,
    hasRemaining,
    hasDeclinedToRestore,
    canSettle: data.canSettle === true,
    partiallyShipped: data.partiallyShipped,
  });
  const isInquiry = data.intent === 'inquiry';
  const idLabel = shortOrderLabel(data.id, { inquiry: isInquiry });

  return (
    <div className={cx('flex flex-col gap-4', actionDock.kind !== 'none' && BOTTOM_DOCK_CLEARANCE_CLASS)}>
      <PageHeader
        title={idLabel}
        subtitle={orderTicketSubtitle(data)}
        onBack={onOrderBack}
        action={
          <div className="flex items-start gap-1">
            <div className="flex flex-col items-end gap-0.5">
              <StatusPill status={data.status} label={tradeListStatusLabel(data.status)} />
              {isInquiry ? (
                <span className="text-[10px] font-emphasis uppercase tracking-wide text-accent">
                  Inquiry
                </span>
              ) : null}
              {/* Part shipped is only a mid-fulfillment pill/timeline cue — never after Settled. */}
              {data.partiallyShipped &&
              data.status === 'confirmed' &&
              data.status !== 'settled' ? (
                <span className="text-[10px] font-emphasis uppercase tracking-wide text-accent">
                  Part shipped
                </span>
              ) : null}
            </div>
            <button
              type="button"
              className={cx(
                'rounded-lg p-1.5 transition-colors',
                orderMenuOpen ? 'bg-foam text-ink' : 'text-muted hover:bg-foam',
              )}
              data-testid="order-more-menu"
              aria-label="More"
              aria-expanded={orderMenuOpen}
              aria-haspopup="menu"
              onClick={() => setOrderMenuOpen((open) => !open)}
            >
              <MoreHorizontalIcon width={20} height={20} />
            </button>
            <MoreActionsSheet
              open={orderMenuOpen}
              onClose={() => setOrderMenuOpen(false)}
              title={idLabel}
              testId="order-more-sheet"
              items={[
                {
                  id: 'order-form',
                  label: 'Order form PDF',
                  icon: <PdfIcon width={20} height={20} />,
                  testId: 'order-form-pdf',
                  onClick: openOrderFormSheet,
                },
                {
                  id: 'manual-ref',
                  label: 'Manual order no.',
                  icon: <PencilIcon width={20} height={20} />,
                  testId: 'order-manual-ref',
                  onClick: openManualRefSheet,
                },
                {
                  id: 'personal-note',
                  label: 'Personal note',
                  icon: <DocumentIcon width={20} height={20} />,
                  testId: 'order-personal-note',
                  onClick: openPersonalNoteSheet,
                },
                {
                  id: 'complaint',
                  label: 'Complaint',
                  icon: <MegaphoneIcon width={20} height={20} />,
                  testId: 'order-complaint',
                  onClick: () => void openComplaintFromOrder(),
                },
              ]}
            />
          </div>
        }
      />

      {data.personalNote &&
      (data.personalNote.note ||
        data.personalNote.noteVoiceUrl ||
        (data.personalNote.images?.length ?? 0) > 0) ? (
        <button
          type="button"
          data-testid="order-personal-note-preview"
          className="w-full rounded-xl bg-foam px-3 py-2 text-left"
          onClick={openPersonalNoteSheet}
        >
          {data.personalNote.note ? (
            <p className="line-clamp-2 text-sm font-emphasis text-ink">{data.personalNote.note}</p>
          ) : (
            <p className="text-sm font-emphasis text-ink">Personal note</p>
          )}
          {data.personalNote.noteVoiceUrl && data.personalNote.noteVoiceDurationMs ? (
            <div className="mt-1.5" onClick={(event) => event.stopPropagation()}>
              <VoicePlayer
                src={toAbsoluteMediaUrl(data.personalNote.noteVoiceUrl)}
                durationMs={data.personalNote.noteVoiceDurationMs}
              />
            </div>
          ) : null}
          {(data.personalNote.images?.length ?? 0) > 0 ? (
            <div
              className="mt-1.5 flex gap-1.5"
              onClick={(event) => event.stopPropagation()}
            >
              {data.personalNote.images!.map((url, index) => (
                <button
                  key={url}
                  type="button"
                  data-testid="order-personal-note-photo"
                  aria-label="View personal note photo"
                  className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-line/40"
                  onClick={() =>
                    openNotePhotos(data.personalNote!.images, index, 'Personal note')
                  }
                >
                  <ManagedImage
                    src={toAbsoluteMediaUrl(url)}
                    alt=""
                    variant={MEDIA_VARIANT.Thumbnail1}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </button>
      ) : null}

      <Card className="flex flex-col gap-1 text-sm">
        <div className="flex flex-col gap-1">
          {(() => {
            const partyCtx = {
              direction: data.direction,
              tradeMode: data.tradeMode,
              buyerName: data.buyerName,
              sellerName: data.sellerName,
              buyerCompanyId: data.buyerCompanyId,
              sellerCompanyId: data.sellerCompanyId,
              triVisible:
                Boolean(data.millDesks?.some((desk) => desk.reveal)) ||
                (data.tradeMode === 'direct' &&
                  Boolean(data.facilitatorCompanyId) &&
                  companyId === data.facilitatorCompanyId),
            };
            const chatTo = data.threadId
              ? data.livingMessageId
                ? `/chats/${data.threadId}?message=${encodeURIComponent(data.livingMessageId)}`
                : `/chats/${data.threadId}`
              : null;
            return orderPartyLines(partyCtx).map((line) => {
              const showChat =
                Boolean(chatTo) && partyLineShowsOpenChat(line, partyCtx);
              const logoUrl =
                line.companyId === data.counterpart.id ? data.counterpart.logoUrl : null;
              return (
                <div
                  key={line.label}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar
                      name={line.name}
                      imageUrl={logoUrl}
                      size={48}
                    />
                    <p className="min-w-0 flex-1 leading-5 text-muted">
                      {line.label} ·{' '}
                      <PartyShopName
                        name={line.name}
                        href={partyCompanyHref(line.you, line.companyId)}
                      />
                    </p>
                  </div>
                  {showChat && chatTo ? (
                    <Link
                      to={chatTo}
                      data-testid="order-open-chat"
                      aria-label={`Open chat with ${line.name}`}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-accent hover:bg-foam"
                    >
                      <ChatIcon width={20} height={20} />
                    </Link>
                  ) : null}
                </div>
              );
            });
          })()}
        </div>
        {orderTicketWaitingCue(data) ? (
          <p
            data-testid="order-ticket-waiting"
            className="flex items-center gap-1.5 pt-1 text-sm text-muted"
          >
            <ClockIcon width={14} height={14} className="shrink-0" aria-hidden />
            {orderTicketWaitingCue(data)}
          </p>
        ) : null}
        {data.tradeMode === 'direct' &&
        data.facilitatorCompanyId &&
        companyId === data.facilitatorCompanyId ? (
          <p className="pt-1 text-sm font-emphasis text-accent">Shared</p>
        ) : null}
        {(data.status === 'confirmed' || data.status === 'part_shipped') &&
        (data.confirmedByName || data.confirmedByRole) ? (
          <p className="pt-1 text-muted">
            {agreementStepLabel(data.confirmedByRole, data.confirmedByName)}
          </p>
        ) : null}
      </Card>

      {(() => {
        const progress = orderTicketProgress(data);
        if (!progress) return null;
        const pct = progress.over
          ? 100
          : Math.min(100, Math.round((progress.shipped / progress.total) * 100));
        return (
          <Card
            className={cx('flex flex-col gap-2', progress.over && 'bg-warning-soft')}
            data-testid="order-ticket-progress"
          >
            <p className="text-sm font-emphasis text-ink">{progress.copy}</p>
            <div className="h-1.5 overflow-hidden rounded-full bg-line">
              <div
                className={cx('h-full rounded-full', progress.over ? 'bg-warning' : 'bg-accent/70')}
                style={{ width: `${pct}%` }}
              />
            </div>
          </Card>
        );
      })()}

      {data.millDesks && data.millDesks.length > 0
        ? data.millDesks.map((desk) => {
            const rows = itemsForMill(data.items, desk);
            const cue = millCue(desk);
            const millDropped = millDeskDropped(desk);
            if (isBuyer) {
              return (
                <Card
                  key={desk.upstreamOrderId}
                  className={cx('flex flex-col gap-3', millDeskCardClass(millDropped))}
                  data-testid={
                    millDropped
                      ? `order-mill-declined-${desk.upstreamOrderId}`
                      : `order-buyer-mill-${desk.upstreamOrderId}`
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-emphasis text-ink">
                        {desk.sellerName}
                        {!desk.held && !millDropped ? (
                          <span className="ml-1.5 text-xs font-emphasis text-accent">
                            {shortOrderLabel(desk.upstreamOrderId)}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted">
                        {millDropped
                          ? 'Declined'
                          : cue ?? `${rows.length} design${rows.length === 1 ? '' : 's'}`}
                      </p>
                    </div>
                    {!desk.held && !millDropped ? (
                      <StatusPill
                        status={desk.status === 'requested' ? 'requested' : desk.status}
                        label={tradeListStatusLabel(
                          desk.status === 'requested' ? 'requested' : desk.status,
                        )}
                      />
                    ) : null}
                  </div>
                  <OrderTicketBillBlock items={rows} showBill={desk.showBillTotal === true}>
                  <OrderUnitGroupedList
                    items={rows}
                    unitOf={(item) => item.unit}
                    getKey={(item) => item.id}
                    hideHeadingWhenSingle
                  >
                    {(item) => {
                    const millLine = millLineForParent(desk, item.id);
                    const cantSupply = item.lineStatus === 'declined';
                    return (
                      <TicketLineWash
                        item={item}
                        className={cx(
                          'flex w-full items-center gap-3 rounded-xl px-1 pt-3',
                          !cantSupply && orderLineBalanceRowClass(item),
                          quoteCantSupplyRowClass(cantSupply),
                        )}
                        data-testid={cantSupply ? 'order-line-cant-supply' : undefined}
                      >
                        <OrderLineCantSupplyFace
                          className="min-w-0 flex-1"
                          item={item}
                          items={data.items}
                          cantSupply={cantSupply}
                          onOpen={openPhotoViewer}
                          soldAs={false}
                          ticketLayout
                        >
                          <OrderLineFacts layout="ticket" item={item} />
                          {millLine?.millRate != null && desk.millQuoted ? (
                            <p className="mt-1 text-meta text-muted">
                              Mill ₹{millLine.millRate.toLocaleString('en-IN')}
                            </p>
                          ) : null}
                        </OrderLineCantSupplyFace>
                      </TicketLineWash>
                    );
                    }}
                  </OrderUnitGroupedList>
                  </OrderTicketBillBlock>
                </Card>
              );
            }
            return (
              <Card
                key={desk.upstreamOrderId}
                className={cx('flex flex-col gap-3', millDeskCardClass(millDropped))}
                data-testid={millDropped ? `order-mill-declined-${desk.upstreamOrderId}` : undefined}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-emphasis text-ink">
                      {desk.sellerName}
                      {!desk.held && !millDropped ? (
                        <span className="ml-1.5 text-xs font-emphasis text-accent">
                          {shortOrderLabel(desk.upstreamOrderId)}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted">
                      {millDropped
                        ? 'Declined'
                        : desk.passHeld
                          ? 'Held'
                          : cue ?? `${rows.length} design${rows.length === 1 ? '' : 's'}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {desk.millThreadId && !desk.held && !millDropped ? (
                      <Link
                        to={`/chats/${desk.millThreadId}`}
                        data-testid={`order-mill-open-chat-${desk.upstreamOrderId}`}
                        aria-label={`Open chat with ${desk.sellerName}`}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-accent hover:bg-foam"
                      >
                        <ChatIcon width={20} height={20} />
                      </Link>
                    ) : null}
                    {!desk.held && !millDropped ? (
                      <StatusPill
                        status={desk.status === 'requested' ? 'requested' : desk.status}
                        label={tradeListStatusLabel(
                          desk.status === 'requested' ? 'requested' : desk.status,
                        )}
                      />
                    ) : null}
                    {!desk.held && !millDropped ? (
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
                {!desk.held && desk.millQuoted ? (
                  <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_4.5rem] items-end gap-2 border-t border-line pt-2">
                    <p className={compactQtyFieldLabelClass}>Design</p>
                    <p className={cx(compactQtyFieldLabelClass, 'text-center')}>
                      From
                      <span className="mt-0.5 block truncate normal-case tracking-normal text-muted">
                        {desk.sellerName}
                      </span>
                    </p>
                    <p className={cx(compactQtyFieldLabelClass, 'text-center')}>
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
                      <SameRateForAll
                        show
                        open={millSameOpen}
                        draft={millSameDraft}
                        applied={sharedMillRate}
                        onOpen={() => {
                          setMillSameDraft(sharedMillRate);
                          setMillSameOpen(true);
                        }}
                        onDraftChange={setMillSameDraft}
                        onApply={() => {
                          const parsed = parseQuoteRateDraft(millSameDraft);
                          if (!parsed) return;
                          const ids = rows.map((item) => item.id);
                          setMillRate((prev) => ({
                            ...prev,
                            ...ratesWithSharedValue(ids, parsed, millRateDefaults),
                          }));
                          setSharedMillRate(parsed);
                          setMillSameOpen(false);
                        }}
                        onCancel={() => setMillSameOpen(false)}
                      />
                    ) : null}
                    <div
                      className="grid grid-cols-[minmax(0,1fr)_4.5rem_7rem] gap-x-2 gap-y-0"
                      {...{ [ORDER_QTY_SCOPE_ATTR]: '' }}
                    >
                      <p className={cx(compactQtyFieldLabelClass, 'pb-2')}>Design</p>
                      <p className={cx(compactQtyFieldLabelClass, 'pb-2 text-center')}>Qty</p>
                      <p className={cx(compactQtyFieldLabelClass, 'pb-2 text-center')}>Rate</p>
                      {rows.map((item) => {
                        const cantSupply = item.lineStatus === 'declined';
                        return (
                        <div
                          key={item.id}
                          className={cx(
                            'col-span-3 grid grid-cols-subgrid items-center gap-x-2 border-t border-line pt-3',
                            quoteCantSupplyRowClass(cantSupply),
                          )}
                          data-testid={cantSupply ? 'order-line-cant-supply' : undefined}
                        >
                          <OrderLineCantSupplyFace
                            item={item}
                            items={data.items}
                            cantSupply={cantSupply}
                            onOpen={openPhotoViewer}
                          />
                          <TextInput
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="off"
                            className={COMPACT_SHEET_NUM_INPUT_CLASS}
                            value={millQty[item.id] ?? String(item.quantity)}
                            onChange={(e) =>
                              setMillQty((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                            aria-label={`Quantity for ${item.name}`}
                            {...orderQtyInputProps(item.id === rows[rows.length - 1]?.id)}
                          />
                          <TextInput
                            inputMode="decimal"
                            className={COMPACT_SHEET_RATE_INPUT_CLASS}
                            value={
                              millRate[item.id] ?? (item.rate != null ? String(item.rate) : '')
                            }
                            onChange={(e) =>
                              setMillRate((prev) => ({
                                ...prev,
                                [item.id]: sanitizeQuoteRateInput(e.target.value),
                              }))
                            }
                            aria-label={`Rate for ${item.name}`}
                          />
                        </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <>
                  <OrderTicketBillBlock items={rows} showBill={desk.showBillTotal === true}>
                  <OrderUnitGroupedList
                    items={rows}
                    unitOf={(item) => item.unit}
                    getKey={(item) => item.id}
                    hideHeadingWhenSingle
                  >
                    {(item) => {
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
                          unit:
                            catalogRateDisplayUnit({
                              unit: item.unit,
                              dispatchUnit: item.dispatchUnit,
                            }) ?? item.unit,
                          formatAmount: rateAmount,
                          formatUnitSuffix: (u) => rateUnitSuffix(u),
                        })
                      : null;
                    const cantSupply = item.lineStatus === 'declined';
                    const extra = orderLineOverShipped(item);
                    const showPending = !cantSupply && orderLineShowsPending(item);
                    const showExtra = !cantSupply && extra > 0;
                    const isComplete =
                      !cantSupply && orderLineBalance(item)?.tone === 'done';
                    return (
                      <TicketLineWash
                        item={item}
                        className={cx(
                          'rounded-xl px-2 pt-3',
                          !cantSupply && orderLineBalanceRowClass(item),
                          quoteCantSupplyRowClass(cantSupply),
                          cells
                            ? 'grid grid-cols-[minmax(0,1fr)_4.5rem_4.5rem] items-center gap-2'
                            : 'flex w-full items-center gap-3',
                        )}
                        data-testid={
                          cantSupply
                            ? 'order-line-cant-supply'
                            : isComplete
                              ? 'order-line-complete'
                              : showPending
                                ? 'order-line-pending'
                                : showExtra
                                  ? 'order-line-extra'
                                  : undefined
                        }
                      >
                        <OrderLineCantSupplyFace
                          className="min-w-0 flex-1"
                          item={item}
                          items={data.items}
                          cantSupply={cantSupply}
                          onOpen={openPhotoViewer}
                          soldAs={false}
                          ticketLayout={!cells}
                        >
                          {!cells ? <OrderLineFacts layout="ticket" item={item} /> : null}
                        </OrderLineCantSupplyFace>
                        {cells ? (
                          <>
                            <RateFigure
                              amount={cells.fromAmount}
                              unit={cells.fromUnit}
                              qtyPrefix={cells.fromQtyPrefix || undefined}
                              muted={cantSupply}
                            />
                            <RateFigure
                              amount={cells.toAmount}
                              unit={cells.toUnit}
                              muted={cantSupply || !data.hasSellerQuote}
                            />
                          </>
                        ) : null}
                      </TicketLineWash>
                    );
                    }}
                  </OrderUnitGroupedList>
                  </OrderTicketBillBlock>
                  </>
                )}
                {desk.held ? (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      className={MILL_CARD_ACTION_CLASS}
                      data-testid={`order-mill-decline-${desk.upstreamOrderId}`}
                      disabled={sendUp.isPending || millDecline.isPending}
                      onClick={() =>
                        setMillDeclineDesk({
                          upstreamOrderId: desk.upstreamOrderId,
                          sellerName: desk.sellerName,
                        })
                      }
                    >
                      Decline
                    </Button>
                    <Button
                      className={MILL_CARD_ACTION_CLASS}
                      data-testid={`order-mill-send-${desk.upstreamOrderId}`}
                      aria-label={`Send to ${desk.sellerName}`}
                      onClick={() =>
                        sendUp.mutate({
                          upstreamOrderId: desk.upstreamOrderId,
                          items: millSendPatches(desk),
                        })
                      }
                      disabled={sendUp.isPending || millDecline.isPending}
                    >
                      {sendUp.isPending ? 'Sending…' : 'Send'}
                    </Button>
                  </div>
                ) : millDropped ? null : desk.revealThreadId ? (
                  <Button
                    variant="secondary"
                    className={COMPACT_SEND_CLASS}
                    data-testid={`order-mill-open-group-chat-${desk.upstreamOrderId}`}
                    onClick={() => navigate(`/chats/${desk.revealThreadId}`)}
                  >
                    Open group chat
                  </Button>
                ) : null}
              </Card>
            );
          })
        : null}

      {/* Mill desks already list every design (trader + Reveal-On buyer). No second aggregate card. */}
      {showOrderParentItemsList(data.millDesks) ? (
      <Card className="flex flex-col gap-2" data-testid="order-parent-items">
        {lineFulfillError ? <InlineNotice message={lineFulfillError} /> : null}
        <div>
          <p className="text-sm font-emphasis text-ink">Designs</p>
          {ticketDesignsCaption(ticketItems) ? (
            <p className="text-xs font-body text-muted">{ticketDesignsCaption(ticketItems)}</p>
          ) : null}
        </div>
        <OrderTicketBillBlock items={ticketBillItems(data.items)} showBill={data.showBillTotal === true}>
        <OrderUnitGroupedList
          items={ticketItems}
          unitOf={(item) => item.unit}
          getKey={(item) => item.id}
          hideHeadingWhenSingle
        >
          {(item) => {
          const canEdit = sellerCanFulfillEdit(data);
          const expanded = expandedLineId === item.id;
          return (
            <OrderLineFulfillExpand
              item={item}
              canEdit={canEdit}
              expanded={expanded}
              busy={setLineSupply.isPending || saveLineQty.isPending}
              photo={
                <OrderLinePhoto
                  item={item}
                  items={data.items}
                  onOpen={openPhotoViewer}
                  size="ticket"
                />
              }
              onToggle={() =>
                setExpandedLineId((prev) => (prev === item.id ? null : item.id))
              }
              onCantSupply={(cantSupply) => {
                setLineFulfillError(null);
                setLineSupply.mutate({ orderItemId: item.id, cantSupply });
              }}
              onOpenQuote={
                isSeller && data.status === 'requested' && confirmOnFace
                  ? openLinesSheet
                  : undefined
              }
              onSaveQty={(quantity) => {
                setLineFulfillError(null);
                saveLineQty.mutate({ orderItemId: item.id, quantity });
              }}
            />
          );
          }}
        </OrderUnitGroupedList>
        </OrderTicketBillBlock>
      </Card>
      ) : null}

      {data.transporter?.trim() && data.shipments.length === 0 ? (
        <p className="text-sm text-muted" data-testid="order-preferred-transporter">
          Transporter · {data.transporter.trim()}
        </p>
      ) : null}

      {openOrderComplaints.length > 0 ? (
        <Card className="flex flex-col gap-2" data-testid="order-open-complaints">
          <p className="text-xs font-body text-muted">Open complaints</p>
          {openOrderComplaints.map((row) => (
            <div
              key={row.id}
              className="flex items-start justify-between gap-3 border-t border-line/70 pt-2 first:border-t-0 first:pt-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-emphasis text-ink">{row.subject}</p>
                <StatusPill status={row.status} />
              </div>
              <button
                type="button"
                data-testid="order-complaint-resolve"
                disabled={resolveComplaint.isPending}
                className="shrink-0 text-sm font-emphasis text-accent disabled:opacity-45"
                onClick={() => resolveComplaint.mutate(row.id)}
              >
                Resolve
              </button>
            </div>
          ))}
        </Card>
      ) : null}

      <OrderTicketNotes
        notes={orderTicketNotes(data, companyId ?? '')}
        canForward={orderTicketCanForwardNotes(data)}
        note={ticketNote}
        onNoteChange={setTicketNote}
        voice={ticketNoteVoice}
        onVoiceChange={setTicketNoteVoice}
        images={ticketNoteImages}
        onImagesChange={setTicketNoteImages}
        onAdd={() => addTicketNote.mutate()}
        adding={addTicketNote.isPending}
        error={ticketNoteError}
        onForward={(noteId) => {
          const released = orderTicketForwardMills(data);
          if (orderTicketCanForwardNotes(data) && !data.downstreamOrderId && released.length > 1) {
            setForwardNoteId(noteId);
            setMillPickOpen(true);
            return;
          }
          forwardTicketNote.mutate({
            noteId,
            millOrderId: released.length === 1 ? released[0]!.orderId : undefined,
          });
        }}
        forwarding={forwardTicketNote.isPending}
        millPickOpen={millPickOpen}
        millPickMills={orderTicketForwardMills(data)}
        onPickMill={(millOrderId) => {
          if (!forwardNoteId) return;
          forwardTicketNote.mutate({ noteId: forwardNoteId, millOrderId });
        }}
        onCloseMillPick={() => {
          setMillPickOpen(false);
          setForwardNoteId(null);
        }}
        onOpenNotePhotos={openNotePhotos}
      />

      <OrderTimeline
        order={data}
        hidePriorQuotes={isBuyer}
        onOpenNotePhotos={openNotePhotos}
      />

      {(() => {
        const ref = data.manualRef;
        if (!ref?.manualOrderNo && !ref?.note && !(ref?.images?.length)) return null;
        return (
          <Card className="flex flex-col gap-1.5" data-testid="order-manual-ref-line">
            <p className="text-xs font-body text-muted">Manual order</p>
            {ref.manualOrderNo ? (
              <p className="text-sm font-emphasis tracking-tight text-ink">{ref.manualOrderNo}</p>
            ) : null}
            {ref.note ? <p className="text-sm text-muted">{ref.note}</p> : null}
            {(ref.images?.length ?? 0) > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {ref.images.map((url, index) => (
                  <button
                    key={url}
                    type="button"
                    data-testid="order-manual-ref-photo"
                    aria-label="View manual order photo"
                    className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-foam"
                    onClick={() =>
                      openNotePhotos(ref.images, index, ref.manualOrderNo ?? 'Manual order')
                    }
                  >
                    <ManagedImage
                      src={toAbsoluteMediaUrl(url)}
                      alt=""
                      variant={MEDIA_VARIANT.Thumbnail1}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </Card>
        );
      })()}

      {data.shipments.length > 0 ? (
        <Card className="flex flex-col gap-3 text-sm">
          <p className="font-emphasis text-ink">Shipments</p>
          {data.shipments.map((shipment) => {
            const legLines = shipmentLegDisplayLines(shipment);
            return (
            <div key={shipment.id} className="border-t border-line pt-2 first:border-0 first:pt-0">
              {legLines.length > 0 ? (
                legLines.map((line) => (
                  <p key={line} className="font-emphasis text-ink">
                    {line}
                  </p>
                ))
              ) : (
                <p className="font-emphasis text-ink">Dispatch</p>
              )}
              <LegPhotoThumbs
                images={shipmentLegImageUrls(shipment)}
                testId={`order-shipment-lr-photos-${shipment.id}`}
              />
              {shipment.transporter ? (
                <p className="text-muted">Transporter · {shipment.transporter}</p>
              ) : null}
              <div className="mt-1 flex flex-col gap-0.5" data-testid="order-shipment-lines">
                {shipment.items.map((line) => (
                  <p key={`${shipment.id}-${line.orderItemId}`} className="text-ink">
                    <span className="font-emphasis">{line.name}</span>
                    <span className="font-title tabular-nums"> × {line.quantity}</span>
                  </p>
                ))}
              </div>
              <p className="mt-1 text-[12px] text-muted">Sent {formatDate(shipment.dispatchedAt)}</p>
              <div className="mt-1.5 flex items-center gap-0.5">
                {data.status !== 'settled' && data.direction === 'selling' ? (
                  <button
                    type="button"
                    data-testid="order-shipment-edit"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted"
                    aria-label="Edit dispatch"
                    onClick={() => openEditShipment(shipment)}
                  >
                    <PencilIcon width={18} height={18} />
                  </button>
                ) : null}
                <button
                  type="button"
                  data-testid="order-shipment-pdf"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted"
                  aria-label="Packing list PDF"
                  onClick={() => openPackingSlipSheet(shipment)}
                >
                  <PdfIcon width={18} height={18} />
                </button>
              </div>
            </div>
            );
          })}
        </Card>
      ) : null}

      <div className="flex flex-col gap-2">
        {data.canSendUp && !(data.millDesks && data.millDesks.length > 0) ? (
          <>
            <Button
              className={COMPACT_SEND_CLASS}
              onClick={() => sendUp.mutate({})}
              disabled={sendUp.isPending}
            >
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
      </div>

      {actionDock.kind !== 'none' ? (
        <BottomTradeDock testId="order-action-dock" aboveAppNav={false}>
          {actionDock.kind === 'buy' ? (
            <>
              {actionDock.declineLogged ? (
                <Button
                  variant="ghost"
                  className="!min-h-12 shrink-0 px-2 text-sm"
                  data-testid="order-dock-decline"
                  disabled={act.isPending}
                  onClick={() => act.mutate('cancel')}
                >
                  Decline
                </Button>
              ) : actionDock.cancel ? (
                <Button
                  variant="ghost"
                  className="!min-h-12 shrink-0 px-2 text-sm"
                  data-testid="order-dock-cancel"
                  disabled={act.isPending || actionWithNote.isPending}
                  onClick={() => {
                    setActionNote('');
                    setActionNoteVoice(null);
                    setActionNoteOpen('cancel');
                  }}
                >
                  {isInquiry && data.status === 'requested' ? 'Cancel inquiry' : 'Cancel'}
                </Button>
              ) : null}
              {actionDock.edit ? (
                <Button
                  variant="secondary"
                  className="!min-h-12 min-w-0 flex-1 px-2.5 text-sm"
                  data-testid="order-dock-edit"
                  onClick={openAmendSheet}
                >
                  {isInquiry ? 'Edit inquiry' : 'Edit'}
                </Button>
              ) : null}
              {actionDock.acceptQuote ? (
                <Button
                  className="!min-h-12 min-w-0 flex-1 px-2.5 text-sm"
                  data-testid="order-dock-accept-quote"
                  disabled={act.isPending}
                  onClick={() => act.mutate('accept-quote')}
                >
                  Accept quote
                </Button>
              ) : null}
            </>
          ) : actionDock.kind === 'requested' ? (
            <>
              <Button
                variant="ghost"
                className="!min-h-12 shrink-0 px-2 text-sm"
                data-testid={actionDock.sendOrder ? 'order-mill-decline-all' : 'order-dock-decline'}
                disabled={act.isPending || actionWithNote.isPending || millDecline.isPending}
                onClick={() => {
                  if (actionDock.sendOrder) {
                    setMillDeclineDesk({ all: true });
                    return;
                  }
                  setActionNote('');
                  setActionNoteVoice(null);
                  setActionNoteOpen('decline');
                }}
              >
                Decline
              </Button>
              {actionDock.confirm ? (
                <Button
                  variant={
                    requestedDockPrimary(actionDock) === 'confirm' ? undefined : 'secondary'
                  }
                  className="!min-h-12 min-w-0 flex-1 px-2.5 text-sm"
                  data-testid="order-dock-confirm"
                  onClick={openLinesSheet}
                >
                  Confirm
                </Button>
              ) : null}
              {actionDock.sendOrder ? (
                <Button
                  variant={
                    requestedDockPrimary(actionDock) === 'sendOrder' ? undefined : 'secondary'
                  }
                  className="!min-h-12 min-w-0 flex-1 px-2.5 text-sm"
                  data-testid="order-mill-send-all"
                  disabled={sendUp.isPending || millDecline.isPending}
                  onClick={() =>
                    sendUp.mutate({
                      items: (data.millDesks ?? [])
                        .filter((desk) => desk.held)
                        .flatMap(millSendPatches),
                    })
                  }
                >
                  {sendUp.isPending ? 'Sending…' : 'Send all'}
                </Button>
              ) : null}
            </>
          ) : (
            <>
              {actionDock.settle ? (
                <Button
                  data-testid="order-settle-open"
                  variant={actionDock.dispatch ? 'secondary' : undefined}
                  className="!min-h-12 min-w-0 flex-1 px-2.5 text-sm"
                  onClick={() => {
                    setSettleNote('');
                    setSettleNoteVoice(null);
                    setSettleNoteImages([]);
                    setSettleQty(defaultSettleFinalQty(settleSheetItems(data.items ?? [])));
                    setSheetError(null);
                    setSettleOpen(true);
                  }}
                >
                  Settle
                </Button>
              ) : null}
              {actionDock.dispatch ? (
                <Button
                  data-testid="order-dispatch-open"
                  className="!min-h-12 min-w-0 flex-1 px-2.5 text-sm"
                  onClick={openDispatchSheet}
                >
                  {actionDock.dispatchMore ? 'Dispatch more' : 'Dispatch'}
                </Button>
              ) : null}
            </>
          )}
        </BottomTradeDock>
      ) : null}

      <Sheet
        open={linesOpen}
        onClose={() => closeSheet('lines')}
        title="Confirm / decline lines"
        titleInfo="Tick what you can supply; set qty — rate if you have it. Confirm locks the ticket. Decline all drops every design."
        titleInfoTestId="order-lines-why"
        footer={
          <div className="flex flex-col gap-2">
            {sheetError && linesOpen ? <InlineNotice message={sheetError} /> : null}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="!min-h-12 shrink-0 px-2 text-sm"
                data-testid="order-lines-decline"
                disabled={openItems.length === 0 || decideLines.isPending}
                onClick={() => decideLines.mutate('decline')}
                aria-label="Decline every open design"
              >
                {decideLines.isPending && decideLines.variables === 'decline'
                  ? 'Saving…'
                  : 'Decline all'}
              </Button>
              <Button
                className="!min-h-12 min-w-0 flex-1 px-2.5 text-sm"
                data-testid="order-lines-confirm"
                disabled={
                  openItems.length === 0 ||
                  linesTally.confirm < 1 ||
                  !linesConfirmReady ||
                  decideLines.isPending
                }
                onClick={() => decideLines.mutate('confirm')}
                aria-label={`Confirm ${linesTally.confirm} ticked design${linesTally.confirm === 1 ? '' : 's'}; unticked become decline`}
              >
                {decideLines.isPending && decideLines.variables === 'confirm'
                  ? 'Saving…'
                  : 'Confirm'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-2 pb-2" {...{ [ORDER_QTY_SCOPE_ATTR]: '' }}>
          {openItems.length > 0 ? (
            <div
              className="flex items-center justify-between gap-2 rounded-xl border border-accent/40 bg-accent/5 px-3 py-2"
              data-testid="order-lines-tally"
            >
              <p className="min-w-0 truncate text-sm font-emphasis text-accent">
                {linesTally.confirm} confirm
              </p>
              {linesTally.decline > 0 ? (
                <p className="shrink-0 text-[12px] font-body text-muted">
                  {linesTally.decline} decline
                </p>
              ) : null}
            </div>
          ) : (
            <InlineNotice message="No open designs left." />
          )}
          {openItems.filter((item) => lineActions[item.id] !== 'decline').length > 1 &&
          !howManyOrderUnitsMixed(
            openItems.filter((item) => lineActions[item.id] !== 'decline'),
          ) ? (
            <SameQtyRateForAll
              show
              open={linesSameOpen}
              alignWith="decideRows"
              qtyDraft={linesSameQtyDraft}
              rateDraft={linesSameRateDraft}
              appliedQty={sharedConfirmQty}
              appliedRate={sharedConfirmRate}
              onOpen={() => {
                setLinesSameQtyDraft(
                  sharedConfirmQty != null ? String(sharedConfirmQty) : '',
                );
                setLinesSameRateDraft(sharedConfirmRate);
                setLinesSameOpen(true);
              }}
              onQtyDraftChange={setLinesSameQtyDraft}
              onRateDraftChange={setLinesSameRateDraft}
              onApply={() => {
                const qtyN = parseSharedQtyDraft(linesSameQtyDraft);
                const parsed = parseQuoteRateDraft(linesSameRateDraft);
                if (qtyN == null && !parsed) return;
                const ids = openItems
                  .filter((item) => lineActions[item.id] !== 'decline')
                  .map((item) => item.id);
                if (qtyN != null) {
                  setLineConfirmQty((prev) => ({
                    ...prev,
                    ...qtysWithSharedValue(ids, String(qtyN), confirmQtyDefaults),
                  }));
                  setSharedConfirmQty(qtyN);
                }
                if (parsed) {
                  setLineConfirmRates((prev) => ({
                    ...prev,
                    ...ratesWithSharedValue(ids, parsed, confirmRateDefaults),
                  }));
                  setSharedConfirmRate(parsed);
                }
                setLinesSameOpen(false);
              }}
              onCancel={() => setLinesSameOpen(false)}
            />
          ) : null}
          {(() => {
            const lastConfirmQtyId = lastGroupedItem(
              openItems.filter((row) => lineActions[row.id] !== 'decline'),
              (row) => row.unit,
            )?.id;
            return (
          <OrderUnitGroupedList
            items={openItems}
            unitOf={(row) => row.unit}
            getKey={(row) => row.id}
            headingTestId="order-sheet-unit-heading"
            testId="order-lines-unit-groups"
          >
          {(item) => {
            const on = lineActions[item.id] !== 'decline';
            const typedQty = Number(lineConfirmQty[item.id]);
            const typedRate = quoteRateNumber(lineConfirmRates[item.id]);
            const factsQty =
              on && Number.isFinite(typedQty) && typedQty >= 1 ? typedQty : item.quantity;
            const factsItem = {
              ...item,
              quantity: factsQty,
              rate: typedRate ?? item.rate,
            };
            return (
              <div
                key={item.id}
                className={cx(
                  'flex items-start gap-2 rounded-xl px-2 py-2',
                  on
                    ? orderLineBalance(factsItem)
                      ? orderLineBalanceRowClass(factsItem)
                      : 'bg-accent/5'
                    : 'bg-foam/50',
                )}
                data-testid="order-lines-decide-row"
              >
                <button
                  type="button"
                  className={cx(
                    'mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2',
                    on
                      ? 'border-accent bg-accent text-on-accent'
                      : 'border-line bg-surface text-transparent',
                  )}
                  aria-pressed={on}
                  aria-label={on ? `Decline ${item.name}` : `Confirm ${item.name}`}
                  data-testid="order-lines-decide-toggle"
                  onClick={() =>
                    setLineActions((prev) => ({
                      ...prev,
                      [item.id]: on ? 'decline' : 'confirm',
                    }))
                  }
                >
                  <CheckIcon width={12} height={12} aria-hidden />
                </button>
                <OrderLineStack
                  className="min-w-0 flex-1"
                  muted={!on}
                  photo={
                    <OrderLinePhoto
                      item={item}
                      items={data.items}
                      onOpen={openPhotoViewer}
                      size="lg"
                    />
                  }
                  title={<OrderDesignTitle name={item.name} muted={!on} />}
                  cues={
                    <>
                      {orderLineLeftoverCue(item) ? (
                        <p className="truncate text-meta font-emphasis text-ink">
                          {orderLineLeftoverCue(item)}
                        </p>
                      ) : null}
                      {on ? null : (
                        <p className="truncate text-meta font-body text-muted">Declined</p>
                      )}
                    </>
                  }
                  facts={
                    on ? (
                      <div
                        className="flex divide-x divide-line/80"
                        data-testid={`order-lines-qty-rate-${item.id}`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p className={compactQtyFieldLabelClass}>Qty</p>
                          <QtyStepper
                            value={Number(lineConfirmQty[item.id]) || item.quantity}
                            chainQty
                            align="start"
                            enterKeyHint={item.id === lastConfirmQtyId ? 'done' : 'next'}
                            inputTestId={`order-lines-qty-${item.id}`}
                            aria-label={`Quantity for ${item.name}`}
                            onChange={(next) =>
                              setLineConfirmQty((prev) => ({
                                ...prev,
                                [item.id]: String(next ?? item.quantity),
                              }))
                            }
                          />
                        </div>
                        <div className="min-w-0 flex-[1.4] pl-2">
                          <label
                            htmlFor={`confirm-rate-${item.id}`}
                            className={compactQtyFieldLabelClass}
                          >
                            Rate
                          </label>
                          <TextInput
                            id={`confirm-rate-${item.id}`}
                            inputMode="decimal"
                            data-testid={`order-lines-rate-${item.id}`}
                            aria-label={`Rate for ${item.name}`}
                            className={COMPACT_SHEET_RATE_INPUT_CLASS}
                            value={lineConfirmRates[item.id] ?? ''}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) =>
                              setLineConfirmRates((prev) => ({
                                ...prev,
                                [item.id]: sanitizeQuoteRateInput(event.target.value),
                              }))
                            }
                          />
                        </div>
                      </div>
                    ) : null
                  }
                />
              </div>
            );
          }}
          </OrderUnitGroupedList>
            );
          })()}
          <NoteAttachField
            label="Manual order no."
            note={linesManualOrderNo}
            onNoteChange={setLinesManualOrderNo}
            voice={null}
            onVoiceChange={() => undefined}
            images={linesManualImages}
            onImagesChange={setLinesManualImages}
            allowVoice={false}
            control="text"
            placeholder="Your book / PO number"
            inputTestId="order-lines-manual-ref-number"
            testId="order-lines-manual-ref"
          />
          <NoteAttachField
            label="Personal note"
            note={linesPersonalNote}
            onNoteChange={setLinesPersonalNote}
            voice={linesPersonalNoteVoice}
            onVoiceChange={setLinesPersonalNoteVoice}
            images={linesPersonalNoteImages}
            onImagesChange={setLinesPersonalNoteImages}
            collapseEmpty
            addLabel="Add personal note"
            hint="Only your company sees this — not the other party."
            testId="order-lines-personal-note"
          />
          <NoteAttachField
            label="Note to buyer"
            note={linesNote}
            onNoteChange={setLinesNote}
            voice={linesNoteVoice}
            onVoiceChange={setLinesNoteVoice}
            images={linesNoteImages}
            onImagesChange={setLinesNoteImages}
            testId="order-lines-buyer-note"
          />
        </div>
      </Sheet>

      <Sheet
        open={Boolean(packingSlipShipment)}
        onClose={() => {
          if (packingSlipBusy) return;
          setPackingSlipShipmentId(null);
        }}
        title="Packing list"
        footer={
          <div className="flex flex-col gap-2">
            <Button
              fullWidth
              data-testid="packing-slip-open"
              disabled={packingSlipBusy || !packingSlipShipment}
              onClick={() => void runPackingSlip('open')}
            >
              {packingSlipBusy ? 'Preparing…' : 'Open PDF'}
            </Button>
            <button
              type="button"
              data-testid="packing-slip-share"
              className="py-1 text-center text-sm font-emphasis text-accent disabled:opacity-45"
              disabled={packingSlipBusy || !packingSlipShipment}
              onClick={() => void runPackingSlip('share')}
            >
              Share
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">Qty uses the order unit. Photos help match the bale.</p>
          {(
            [
              {
                key: 'showBuyer' as const,
                label: 'Show buyer',
                testId: 'packing-slip-show-buyer',
              },
              {
                key: 'showPhotos' as const,
                label: 'Show design photos',
                testId: 'packing-slip-show-photos',
              },
            ] as const
          ).map((row) => {
            const on = packingSlipOpts[row.key];
            return (
              <button
                key={row.key}
                type="button"
                data-testid={row.testId}
                aria-pressed={on}
                className={cx(
                  'flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left',
                  on ? 'border-accent bg-accent/5' : 'border-line bg-surface',
                )}
                onClick={() =>
                  setPackingSlipOpts((prev) => ({ ...prev, [row.key]: !prev[row.key] }))
                }
              >
                <span className="text-sm font-emphasis text-ink">{row.label}</span>
                <span className="text-[12px] font-body text-muted">{on ? 'On' : 'Off'}</span>
              </button>
            );
          })}
        </div>
      </Sheet>

      <Sheet
        open={orderFormOpen}
        onClose={() => {
          if (orderFormBusy) return;
          setOrderFormOpen(false);
        }}
        title="Order form"
        footer={
          <div className="flex flex-col gap-2">
            <Button
              fullWidth
              data-testid="order-form-open"
              disabled={orderFormBusy}
              onClick={() => void runOrderForm('open')}
            >
              {orderFormBusy ? 'Preparing…' : 'Open PDF'}
            </Button>
            <button
              type="button"
              data-testid="order-form-share"
              className="py-1 text-center text-sm font-emphasis text-accent disabled:opacity-45"
              disabled={orderFormBusy}
              onClick={() => void runOrderForm('share')}
            >
              Share
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">Qty uses the order unit. Photos help match the design.</p>
          <button
            type="button"
            data-testid="order-form-show-photos"
            aria-pressed={orderFormShowPhotos}
            className={cx(
              'flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left',
              orderFormShowPhotos ? 'border-accent bg-accent/5' : 'border-line bg-surface',
            )}
            onClick={() => setOrderFormShowPhotos((on) => !on)}
          >
            <span className="text-sm font-emphasis text-ink">Show design photos</span>
            <span className="text-[12px] font-body text-muted">
              {orderFormShowPhotos ? 'On' : 'Off'}
            </span>
          </button>
        </div>
      </Sheet>

      <Sheet
        open={dispatchOpen}
        onClose={() => closeSheet('dispatch')}
        title="Dispatch"
        footer={
          editingShipmentId || dispatchLines.length === 0 ? undefined : (
          <div className="flex flex-col gap-1.5">
            {dispatchError && !editingShipmentId ? (
              <InlineNotice message={dispatchError} />
            ) : null}
            {dispatchThisLrSummary ? (
              <div data-testid="order-dispatch-tally">
                <p className="text-[12px] font-body text-muted">This LR</p>
                <OrderQtyFooterSummary summary={dispatchThisLrSummary} />
              </div>
            ) : null}
            <Button
              fullWidth
              data-testid="order-dispatch-confirm"
              onClick={submitDispatch}
              disabled={dispatchOrder.isPending || dispatchTally.designs < 1}
            >
              {dispatchOrder.isPending ? 'Saving…' : 'Confirm dispatch'}
            </Button>
          </div>
          )
        }
      >
        <div className="flex flex-col gap-2 pb-2" {...{ [ORDER_QTY_SCOPE_ATTR]: '' }}>
          {dispatchLines.length === 0 && declinedDispatchItems.length === 0 ? (
            <p className="px-1 text-sm text-muted">Nothing left for a new LR.</p>
          ) : (
            <>
              <OrderUnitGroupedList
                items={dispatchLines}
                unitOf={(row) => row.unit}
                getKey={(row) => row.id}
                role="dispatching"
                headingTestId="order-sheet-unit-heading"
                testId="order-dispatch-unit-groups"
              >
              {(item) => {
                const on = shipOn[item.id] === true;
                const thisLr = on ? lineDispatchQty(item, shipQty) : 0;
                const factsItem = orderLineFactsWithThisLr(item, thisLr, on);
                const lastDispatchQtyId = lastGroupedItem(
                  dispatchLines.filter((line) => shipOn[line.id] === true),
                  (line) => line.unit,
                )?.id;
                return (
                  <div
                    key={item.id}
                    className={cx(
                      'flex flex-col gap-1.5 rounded-xl px-2.5 py-2',
                      orderLineBalanceRowClass(factsItem) ||
                        (on ? 'bg-accent/5' : 'bg-foam/50'),
                    )}
                    data-testid="order-dispatch-line"
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        className={cx(
                          'mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2',
                          on
                            ? 'border-accent bg-accent text-on-accent'
                            : 'border-line bg-surface text-transparent',
                        )}
                        aria-pressed={on}
                        aria-label={on ? `Later ${item.name}` : `This LR ${item.name}`}
                        data-testid="order-dispatch-line-toggle"
                        onClick={() => {
                          const next = !on;
                          setShipOn((prev) => ({
                            ...prev,
                            [item.id]: next,
                          }));
                          if (next) {
                            setShipQty((prev) => ({
                              ...prev,
                              [item.id]: dispatchQtyAfterSelect(item, prev[item.id]),
                            }));
                          }
                        }}
                      >
                        <CheckIcon
                          width={12}
                          height={12}
                          data-testid="order-dispatch-line-check"
                          aria-hidden
                        />
                      </button>
                      <OrderLineStack
                        className="min-w-0 flex-1"
                        photo={
                          <OrderLinePhoto
                            item={item}
                            items={data.items}
                            onOpen={openPhotoViewer}
                            size="lg"
                          />
                        }
                        title={
                          <OrderDesignTitle
                            name={item.name}
                            nameTestId="order-dispatch-line-name"
                            extra={<OrderLineMoneyLine item={item} />}
                          />
                        }
                        cues={
                          orderLineLeftoverCue(item) ? (
                            <p className="truncate text-meta font-emphasis text-ink">
                              {orderLineLeftoverCue(item)}
                            </p>
                          ) : null
                        }
                        trailing={
                          <DispatchLineRemainder
                            item={item}
                            thisLrQty={thisLr}
                            includeThisLr={on}
                          />
                        }
                        facts={
                          <DispatchLinePreview
                            item={item}
                            thisLrControl={
                              <QtyStepper
                                value={on ? thisLr : 0}
                                disabled={!on}
                                chainQty
                                align="start"
                                enterKeyHint={item.id === lastDispatchQtyId ? 'done' : 'next'}
                                inputTestId="order-dispatch-line-qty"
                                aria-label={`This LR quantity for ${item.name}`}
                                onChange={(next) => {
                                  if (!on) return;
                                  setShipQty((prev) => ({
                                    ...prev,
                                    [item.id]: String(next ?? 1),
                                  }));
                                }}
                              />
                            }
                          />
                        }
                      />
                    </div>
                  </div>
                );
              }}
              </OrderUnitGroupedList>
              {declinedDispatchItems.length > 0 ? (
                <div className="flex flex-col gap-2 pt-1" data-testid="order-dispatch-cant-supply">
                  {declinedDispatchItems.map((item) => (
                    <div
                      key={item.id}
                      className={cx(
                        'rounded-xl px-2 py-1.5',
                        quoteCantSupplyRowClass(true),
                      )}
                      data-testid="order-dispatch-cant-supply-line"
                    >
                      <OrderLineStack
                        muted
                        photo={
                          <OrderLinePhoto
                            item={item}
                            items={data.items}
                            onOpen={openPhotoViewer}
                            size="sm"
                          />
                        }
                        title={<OrderDesignTitle name={item.name} muted />}
                        trailing={
                          <button
                            type="button"
                            className="shrink-0 px-1 text-[12px] font-emphasis text-accent disabled:opacity-45"
                            data-testid="order-dispatch-restore-supply"
                            disabled={setLineSupply.isPending}
                            onClick={() =>
                              setLineSupply.mutate({ orderItemId: item.id, cantSupply: false })
                            }
                          >
                            Restore
                          </button>
                        }
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          )}
          {!editingShipmentId && dispatchLines.length > 0 ? (
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <TransporterField
                  value={dispatch.transporter ?? ''}
                  onChange={(next) =>
                    setDispatch((prev) => ({ ...prev, transporter: next }))
                  }
                />
                <Field label="Parcels">
                  <TextInput
                    type="number"
                    min={1}
                    value={dispatch.parcelCount ?? ''}
                    placeholder="1"
                    onChange={(event) => {
                      const raw = event.target.value;
                      if (!raw) {
                        setDispatch((prev) => ({
                          ...prev,
                          parcelCount: undefined,
                          legs: resizeDispatchLegs(prev.legs, 1),
                        }));
                        return;
                      }
                      const n = Number(raw);
                      setDispatch((prev) => ({
                        ...prev,
                        parcelCount: n,
                        legs: resizeDispatchLegs(prev.legs, n),
                      }));
                    }}
                  />
                </Field>
              </div>
              <div className="flex flex-col gap-1.5" data-testid="order-dispatch-legs">
                {dispatch.legs.map((leg, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-1.5"
                    data-testid="order-dispatch-leg-row"
                  >
                    <DispatchLrBillInputs
                      lrNumber={leg.lrNumber}
                      billNumber={leg.billNumber}
                      index={index}
                      onLrNumber={(next) =>
                        setDispatch((prev) => ({
                          ...prev,
                          legs: prev.legs.map((row, i) =>
                            i === index ? { ...row, lrNumber: next } : row,
                          ),
                        }))
                      }
                      onBillNumber={(next) =>
                        setDispatch((prev) => ({
                          ...prev,
                          legs: prev.legs.map((row, i) =>
                            i === index ? { ...row, billNumber: next } : row,
                          ),
                        }))
                      }
                    />
                    <LegPhotoAttach
                      images={leg.imageUrls ?? []}
                      testIdPrefix={`order-dispatch-leg-${index}`}
                      onImagesChange={(imageUrls) =>
                        setDispatch((prev) => ({
                          ...prev,
                          legs: prev.legs.map((row, i) =>
                            i === index ? { ...row, imageUrls } : row,
                          ),
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {priorShipments.length > 0 ? (
            <div className="flex flex-col gap-2" data-testid="order-dispatch-prior">
              <button
                type="button"
                data-testid="order-dispatch-prior-toggle"
                className="flex w-full items-center justify-between gap-2 px-1 py-1 text-left"
                aria-expanded={priorListShown}
                onClick={() => {
                  if (priorListShown) {
                    setPriorListOpen(false);
                    setEditingShipmentId(null);
                    setDispatchError(null);
                    return;
                  }
                  setPriorListOpen(true);
                }}
              >
                <p className="min-w-0 truncate text-xs font-body text-muted">
                  {previousDispatchesCue(priorShipments.length)}
                </p>
                <ChevronRightIcon
                  width={16}
                  height={16}
                  aria-hidden
                  className={cx(
                    'shrink-0 text-muted transition-transform',
                    priorListShown && 'rotate-90',
                  )}
                />
              </button>
              {priorListShown
                ? priorShipments.map((shipment) => {
                    const expanded = editingShipmentId === shipment.id;
                    return (
                      <div
                        key={shipment.id}
                        className={cx(
                          'rounded-xl border px-3 py-2',
                          expanded
                            ? 'border-accent/40 bg-accent/5'
                            : 'border-line bg-foam/60 opacity-70',
                        )}
                        data-testid="order-dispatch-prior-row"
                        data-expanded={expanded ? 'true' : 'false'}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            {(() => {
                              const legLines = shipmentLegDisplayLines(shipment);
                              if (legLines.length === 0) {
                                return (
                                  <p className="truncate text-sm font-emphasis text-ink">
                                    Previous dispatch
                                  </p>
                                );
                              }
                              return (
                                <>
                                  {legLines.map((line) => (
                                    <p key={line} className="truncate text-sm font-emphasis text-ink">
                                      {line}
                                    </p>
                                  ))}
                                  <LegPhotoThumbs
                                    images={shipmentLegImageUrls(shipment)}
                                    testId={`order-dispatch-prior-lr-photos-${shipment.id}`}
                                  />
                                </>
                              );
                            })()}
                            <p className="text-meta text-muted">
                              {formatDate(shipment.dispatchedAt)}
                            </p>
                            {!expanded ? (
                              <p className="truncate text-meta text-muted">
                                {shipment.items
                                  .map((line) => `${line.name} × ${line.quantity}`)
                                  .join(' · ')}
                              </p>
                            ) : null}
                          </div>
                          {data.status !== 'settled' ? (
                            <button
                              type="button"
                              data-testid="order-dispatch-prior-edit"
                              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted"
                              aria-label={expanded ? 'Close edit' : 'Edit dispatch'}
                              onClick={() => togglePriorShipmentEdit(shipment)}
                            >
                              {expanded ? (
                                <CloseIcon width={18} height={18} />
                              ) : (
                                <PencilIcon width={18} height={18} />
                              )}
                            </button>
                          ) : null}
                        </div>
                        {expanded ? (
                          <div
                            className="mt-3 flex flex-col gap-2 border-t border-line pt-3"
                            data-testid="order-dispatch-prior-expand"
                          >
                            <OrderUnitGroupedList
                              items={(data.items ?? []).filter(
                                (item) => editShipOn[item.id] !== undefined,
                              )}
                              unitOf={(row) => row.unit}
                              getKey={(row) => row.id}
                              role="dispatching"
                              headingTestId="order-sheet-unit-heading"
                              testId="order-dispatch-edit-unit-groups"
                            >
                              {(item) => {
                                const active = editShipOn[item.id] !== false;
                                return (
                                  <div
                                    key={item.id}
                                    className={cx(
                                      'flex items-center gap-1.5 rounded-lg px-1 py-1.5',
                                      active ? '' : 'opacity-50',
                                    )}
                                    data-testid="order-dispatch-edit-line"
                                  >
                                    <button
                                      type="button"
                                      className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                                      onClick={() =>
                                        setEditShipOn((prev) => ({
                                          ...prev,
                                          [item.id]: !active,
                                        }))
                                      }
                                    >
                                      <OrderLinePhoto
                                        item={item}
                                        items={data.items}
                                        onOpen={openPhotoViewer}
                                        size="sm"
                                      />
                                      <p className="min-w-0 truncate text-sm font-emphasis text-ink">
                                        {item.name}
                                      </p>
                                    </button>
                                    <TextInput
                                      type="number"
                                      min={0}
                                      disabled={!active}
                                      data-testid="order-dispatch-line-qty"
                                      className={COMPACT_QTY_INPUT_CLASS}
                                      value={editShipQty[item.id] ?? ''}
                                      onChange={(event) =>
                                        setEditShipQty((prev) => ({
                                          ...prev,
                                          [item.id]: event.target.value,
                                        }))
                                      }
                                    />
                                  </div>
                                );
                              }}
                            </OrderUnitGroupedList>
                            <div className="grid grid-cols-2 gap-2">
                              <TransporterField
                                value={editDispatch.transporter ?? ''}
                                onChange={(next) =>
                                  setEditDispatch((prev) => ({
                                    ...prev,
                                    transporter: next,
                                  }))
                                }
                                testId="edit-transporter-field"
                              />
                              <Field label="Parcels">
                                <TextInput
                                  type="number"
                                  min={1}
                                  value={editDispatch.parcelCount ?? ''}
                                  placeholder="1"
                                  onChange={(event) => {
                                    const raw = event.target.value;
                                    if (!raw) {
                                      setEditDispatch((prev) => ({
                                        ...prev,
                                        parcelCount: undefined,
                                        legs: resizeDispatchLegs(prev.legs, 1),
                                      }));
                                      return;
                                    }
                                    const n = Number(raw);
                                    setEditDispatch((prev) => ({
                                      ...prev,
                                      parcelCount: n,
                                      legs: resizeDispatchLegs(prev.legs, n),
                                    }));
                                  }}
                                />
                              </Field>
                            </div>
                            <div className="flex flex-col gap-1.5" data-testid="order-dispatch-edit-legs">
                              {editDispatch.legs.map((leg, index) => (
                                <div
                                  key={index}
                                  className="flex flex-col gap-1.5"
                                  data-testid="order-dispatch-edit-leg-row"
                                >
                                  <DispatchLrBillInputs
                                    lrNumber={leg.lrNumber}
                                    billNumber={leg.billNumber}
                                    index={index}
                                    onLrNumber={(next) =>
                                      setEditDispatch((prev) => ({
                                        ...prev,
                                        legs: prev.legs.map((row, i) =>
                                          i === index ? { ...row, lrNumber: next } : row,
                                        ),
                                      }))
                                    }
                                    onBillNumber={(next) =>
                                      setEditDispatch((prev) => ({
                                        ...prev,
                                        legs: prev.legs.map((row, i) =>
                                          i === index ? { ...row, billNumber: next } : row,
                                        ),
                                      }))
                                    }
                                  />
                                  <LegPhotoAttach
                                    images={leg.imageUrls ?? []}
                                    testIdPrefix={`order-dispatch-edit-leg-${index}`}
                                    onImagesChange={(imageUrls) =>
                                      setEditDispatch((prev) => ({
                                        ...prev,
                                        legs: prev.legs.map((row, i) =>
                                          i === index ? { ...row, imageUrls } : row,
                                        ),
                                      }))
                                    }
                                  />
                                </div>
                              ))}
                            </div>
                            {dispatchError && editingShipmentId === shipment.id ? (
                              <InlineNotice message={dispatchError} />
                            ) : null}
                            <Button
                              fullWidth
                              data-testid="order-dispatch-prior-save"
                              onClick={submitEditShipment}
                              disabled={
                                editShipment.isPending ||
                                Object.values(editShipOn).filter(Boolean).length < 1
                              }
                            >
                              {editShipment.isPending ? 'Saving…' : 'Save changes'}
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                : null}
            </div>
          ) : null}
          <NoteAttachField
            label="Note"
            note={dispatchNote}
            onNoteChange={setDispatchNote}
            voice={dispatchNoteVoice}
            onVoiceChange={setDispatchNoteVoice}
            images={dispatchNoteImages}
            onImagesChange={setDispatchNoteImages}
          />
        </div>
      </Sheet>

      <Sheet
        open={settleOpen}
        onClose={() => closeSheet('settle')}
        title="Settle order"
        footer={
          <div className="flex flex-col gap-1.5">
            {sheetError && settleOpen ? <InlineNotice message={sheetError} /> : null}
            {settleLeftoverSummary ? (
              <div data-testid="order-settle-tally">
                <p className="text-[12px] font-body text-muted">Won’t ship</p>
                <OrderQtyFooterSummary summary={settleLeftoverSummary} />
              </div>
            ) : null}
            <Button
              fullWidth
              data-testid="order-settle-confirm"
              disabled={settleOrder.isPending}
              onClick={() => settleOrder.mutate()}
            >
              {settleOrder.isPending ? 'Settling…' : 'Settle order'}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-2 pb-2" {...{ [ORDER_QTY_SCOPE_ATTR]: '' }}>
          <p className="text-sm text-muted">Closes leftover. No new LR.</p>
          <OrderUnitGroupedList
            items={settleLines}
            unitOf={(row) => row.unit}
            getKey={(row) => row.id}
            headingTestId="order-sheet-unit-heading"
            testId="order-settle-unit-groups"
          >
            {(item) => {
              const pending = item.remainingQuantity ?? 0;
              const finalQty = lineSettleFinalQty(item, settleQty);
              const previewItem = orderLineFactsForSettleRemainder(item, finalQty);
              return (
                <div
                  key={item.id}
                  className={cx(
                    'flex flex-col gap-1.5 rounded-xl px-2.5 py-2',
                    orderLineBalanceRowClass(previewItem) || 'bg-foam/50',
                  )}
                  data-testid={
                    pending > 0 ? 'settle-line-pending' : 'settle-line-done'
                  }
                >
                  <OrderLineStack
                    photo={
                      <OrderLinePhoto
                        item={item}
                        items={data.items}
                        onOpen={openPhotoViewer}
                        size="lg"
                      />
                    }
                    title={
                      <OrderDesignTitle
                        name={item.name}
                        extra={<OrderLineMoneyLine item={item} />}
                      />
                    }
                    trailing={<SettleLineRemainder item={item} finalQty={finalQty} />}
                    facts={
                      <SettleLinePreview
                        item={item}
                        finalControl={
                          <TextInput
                            id={`settle-final-${item.id}`}
                            type="number"
                            min={0}
                            max={item.shippedQuantity ?? 0}
                            data-testid="order-settle-line-qty"
                            aria-label={`Final quantity for ${item.name}`}
                            className={COMPACT_QTY_INPUT_CLASS}
                            value={settleQty[item.id] ?? String(finalQty)}
                            onChange={(event) => {
                              const shipped = item.shippedQuantity ?? 0;
                              const next = clampSettleQtyInput(event.target.value, shipped);
                              setSettleQty((prev) => ({
                                ...prev,
                                [item.id]: next,
                              }));
                            }}
                            {...orderQtyInputProps(item.id === lastSettleId)}
                          />
                        }
                      />
                    }
                  />
                </div>
              );
            }}
          </OrderUnitGroupedList>
          <NoteAttachField
            label="Note"
            note={settleNote}
            onNoteChange={setSettleNote}
            voice={settleNoteVoice}
            onVoiceChange={setSettleNoteVoice}
            images={settleNoteImages}
            onImagesChange={setSettleNoteImages}
          />
        </div>
      </Sheet>

      <AmendOrderSheet
        open={amendOpen}
        onClose={() => closeSheet('amend')}
        title={isInquiry ? 'Edit inquiry' : 'Edit order'}
        items={ticketDisplayItems(data.items ?? [])}
        qty={amendQty}
        onQty={(productId, next) =>
          setAmendQty((prev) => {
            const patch = next == null ? '' : String(next);
            const nextQty = { ...prev };
            for (const id of catalogPeerProductIds(data.items ?? [], productId)) {
              nextQty[id] = patch;
            }
            return nextQty;
          })
        }
        removed={amendRemoved}
        onToggleRemoved={(productId) =>
          setAmendRemoved((prev) => {
            const next = new Set(prev);
            const peers = catalogPeerProductIds(data.items ?? [], productId);
            const removing = !next.has(productId);
            for (const id of peers) {
              if (removing) next.add(id);
              else next.delete(id);
            }
            return next;
          })
        }
        lineNotes={amendLineNotes}
        onLineNote={(productId, value) =>
          setAmendLineNotes((prev) => ({ ...prev, [productId]: value }))
        }
        transporter={amendTransporter}
        onTransporter={setAmendTransporter}
        transporterDisabled={amendOrder.isPending}
        note={amendNote}
        onNote={setAmendNote}
        voice={amendNoteVoice}
        onVoice={setAmendNoteVoice}
        images={amendNoteImages}
        onImages={setAmendNoteImages}
        error={sheetError && amendOpen ? sheetError : null}
        saving={amendOrder.isPending}
        onSave={() => amendOrder.mutate()}
        onOpenPhoto={(item) => openPhotoViewer(galleryIndexForItem(data.items ?? [], item.id))}
      />


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
        <div className="flex flex-col gap-3" {...{ [ORDER_QTY_SCOPE_ATTR]: '' }}>
          <p className="text-sm text-muted">Edit qty or rate, then Send to the design owners.</p>
          {(order.data?.items ?? [])
            .filter((item) => item.productId)
            .map((item, index, list) => (
              <div key={item.id} className="flex items-center gap-3">
                <OrderLinePhoto
                  item={item}
                  items={order.data?.items ?? []}
                  onOpen={openPhotoViewer}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <OrderDesignTitle
                    name={item.name}
                    extra={
                      orderLineLeftoverCue(item) ? (
                        <p className="truncate text-meta font-emphasis text-ink">
                          {orderLineLeftoverCue(item)}
                        </p>
                      ) : null
                    }
                  />
                  <div className="mt-1 flex gap-2">
                    <Field label="Qty">
                      <TextInput
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="off"
                        className={COMPACT_SHEET_NUM_INPUT_CLASS}
                        value={changeQty[item.productId!] ?? ''}
                        onChange={(event) =>
                          setChangeQty((prev) => ({
                            ...prev,
                            [item.productId!]: event.target.value,
                          }))
                        }
                        {...orderQtyInputProps(index === list.length - 1)}
                      />
                    </Field>
                    <Field label="Rate">
                      <TextInput
                        inputMode="decimal"
                        autoComplete="off"
                        className={COMPACT_SHEET_RATE_INPUT_CLASS}
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

      <ConfirmActionSheet
        open={millDeclineDesk != null}
        title={
          millDeclineDesk?.all
            ? 'Decline order?'
            : millDeclineDesk
              ? `Decline ${millDeclineDesk.sellerName}?`
              : 'Decline mill?'
        }
        body={
          millDeclineDesk?.all
            ? 'Waiting mills never see these lots.'
            : 'They never see this lot. Other mills stay.'
        }
        confirmLabel="Decline"
        testId="order-mill-decline-confirm"
        busy={millDecline.isPending}
        onCancel={() => setMillDeclineDesk(null)}
        onConfirm={() => {
          if (!millDeclineDesk) return;
          millDecline.mutate(
            millDeclineDesk.all ? {} : { upstreamOrderId: millDeclineDesk.upstreamOrderId },
          );
        }}
      />

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
          <NoteAttachField
            label="Note"
            note={actionNote}
            onNoteChange={setActionNote}
            voice={actionNoteVoice}
            onVoiceChange={setActionNoteVoice}
            images={actionNoteImages}
            onImagesChange={setActionNoteImages}
          />
        </div>
      </Sheet>

      <Sheet
        open={manualRefOpen}
        onClose={() => setManualRefOpen(false)}
        title="Manual order no."
        footer={
          <Button
            fullWidth
            data-testid="order-manual-ref-save"
            disabled={saveManualRef.isPending}
            onClick={() => saveManualRef.mutate()}
          >
            {saveManualRef.isPending ? 'Saving…' : 'Save'}
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          <Field label="Order number">
            <TextInput
              value={manualOrderNo}
              onChange={(event) => setManualOrderNo(event.target.value)}
              placeholder="Your book / PO number"
              data-testid="order-manual-ref-number"
            />
          </Field>
          <NoteAttachField
            label="Note"
            note={manualNote}
            onNoteChange={setManualNote}
            voice={null}
            onVoiceChange={() => undefined}
            images={manualImages}
            onImagesChange={setManualImages}
            allowVoice={false}
          />
        </div>
      </Sheet>

      <Sheet
        open={personalNoteOpen}
        onClose={() => setPersonalNoteOpen(false)}
        title="Personal note"
        footer={
          <Button
            fullWidth
            data-testid="order-personal-note-save"
            disabled={savePersonalNote.isPending}
            onClick={() => savePersonalNote.mutate()}
          >
            {savePersonalNote.isPending ? 'Saving…' : 'Save'}
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">Only your company sees this — not the other party.</p>
          <NoteAttachField
            label="Note"
            note={personalNote}
            onNoteChange={setPersonalNote}
            voice={personalNoteVoice}
            onVoiceChange={setPersonalNoteVoice}
            images={personalNoteImages}
            onImagesChange={setPersonalNoteImages}
            optional={false}
          />
        </div>
      </Sheet>

      <Sheet
        open={complaintAgainstOpen}
        onClose={() => setComplaintAgainstOpen(false)}
        title="Complaint about"
      >
        <div className="flex flex-col gap-2 pb-2">
          <p className="text-sm text-muted">Who is this about?</p>
          {complaintTargets.map((target) => {
            const cue = complaintRoleCue(target.role);
            return (
              <button
                key={target.companyId}
                type="button"
                data-testid="order-complaint-against"
                className="flex w-full items-center justify-between rounded-xl border border-line px-3 py-3 text-left hover:border-accent hover:bg-accent/5"
                onClick={() => void goComplaintAgainst(target)}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-emphasis text-ink">
                    {target.name}
                  </span>
                  {cue ? <span className="text-xs text-muted">{cue}</span> : null}
                </span>
              </button>
            );
          })}
        </div>
      </Sheet>

      <PhotoViewer
        open={photoViewerOpen && photoGallery.length > 0}
        urls={photoGallery}
        index={photoViewerIndex}
        onIndex={setPhotoViewerIndex}
        onClose={() => {
          setPhotoViewerOpen(false);
          setNoteViewerUrls(null);
          setNoteViewerCaption(null);
        }}
        captions={photoCaptions}
        details={photoDetails}
      />
    </div>
  );
}
