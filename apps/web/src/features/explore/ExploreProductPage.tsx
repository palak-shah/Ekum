import { useState } from 'react';
import { usePageOwnsBottomBand } from '@/features/browse/selectionBottomBand';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  OrderIntent,
  OrderKind,
  categoryDisplayLabel,
  type AccessRequestView,
  type ExploreProductPreviewView,
  type OrderView,
  type ProductView,
} from '@ekum/domain-types';
import {
  BottomTradeDock,
  SELECTION_DOCK_CLEARANCE_CLASS,
} from '@/features/browse/BottomTradeDock';
import { CurateFromSelectionSheet } from '@/features/browse/CurateFromSelectionSheet';
import { RELIST_LOCKED_TOAST } from '@/features/browse/forwardGate';
import { DEFAULT_ACCESS_REQUEST_NOTE } from '@/lib/accessRequestNote';
import {
  readCatalogHandlerName,
  resolveFacilitatorForCatalog,
  resolveOrderPathForCatalog,
} from '@/features/browse/forwardAttribution';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import { HowManyEachSheet } from '@/features/orders/HowManyEachSheet';
import { placeNoteAttachFields } from '@/features/orders/placeNoteAttach';
import { useSaveToggle } from '@/features/saved/useSaveToggle';
import { api, ApiError } from '@/lib/apiClient';
import { formatCatalogRate } from '@/lib/catalogRate';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';
import { navigateToOrderChat } from '@/features/orders/navigateToOrderChat';
import { useMyCompany } from '@/lib/queries';
import { PageHeader } from '@/ui/PageHeader';
import { PhotoViewer } from '@/ui/PhotoViewer';
import { useToast } from '@/ui/Toast';
import { Button, ErrorState, LoadingBlock, Tag, cx } from '@/ui/kit';
import { CompanyRow } from '@/ui/cards';
import { exploreProductTradeDock } from './exploreProductChrome';

export function ExploreProductPage() {
  const { id = '' } = useParams();
  const [searchParams] = useSearchParams();
  const facilitatorCompanyId = resolveFacilitatorForCatalog({
    catalogKind: 'product',
    catalogId: id,
    queryFacilitator: searchParams.get('facilitator'),
  });
  const stampedPath = resolveOrderPathForCatalog({
    catalogKind: 'product',
    catalogId: id,
    queryPath: searchParams.get('path'),
  });
  const stampedHandle = stampedPath === 'handle';
  const handlePath = stampedHandle && Boolean(facilitatorCompanyId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const me = useMyCompany();
  const shortlist = useBrowseShortlist();
  const [qtyOpen, setQtyOpen] = useState(false);
  const [qtyJob, setQtyJob] = useState<'order' | 'ask'>('order');
  const [curateOpen, setCurateOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [orderError, setOrderError] = useState<string | null>(null);

  const product = useQuery({
    queryKey: ['explore', 'product', id],
    queryFn: () => api.get<ExploreProductPreviewView>(`/explore/products/${id}`),
    enabled: Boolean(id),
  });
  const save = useSaveToggle({ productId: id });
  const requestAccess = useMutation({
    mutationFn: (targetCompanyId: string) =>
      api.post<AccessRequestView>('/access-requests', {
        targetCompanyId,
        note: DEFAULT_ACCESS_REQUEST_NOTE,
      }),
    onSuccess: () => {
      showToast('Request sent — they will see it in chat.', 'success');
      void queryClient.invalidateQueries({ queryKey: ['access-requests'] });
    },
    onError: (error) =>
      showToast(error instanceof ApiError ? error.message : 'Could not send request.', 'danger'),
  });

  const createOrder = useMutation({
    mutationFn: (input: {
      lines: Array<{ productId: string; quantity: number; note?: string }>;
      transporter?: string;
      note?: string;
      noteVoiceMediaId?: string;
      noteVoiceDurationMs?: number;
      noteImageUrls?: string[];
    }) =>
      api.post<OrderView & { threadId?: string | null }>('/orders', {
        sellerCompanyId:
          handlePath && facilitatorCompanyId ? facilitatorCompanyId : product.data!.company.id,
        kind: OrderKind.Standard,
        ...(input.transporter?.trim() ? { transporter: input.transporter.trim() } : {}),
        ...placeNoteAttachFields(input),
        ...(handlePath
          ? { orderPathPreference: 'handle' as const }
          : { facilitatorCompanyId }),
        items: input.lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          images: [],
          ...(line.note?.trim() ? { note: line.note.trim() } : {}),
        })),
      }),
    onSuccess: (order) => {
      setQtyOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      void navigateToOrderChat(navigate, queryClient, order, { replace: true });
    },
    onError: (error) =>
      setOrderError(error instanceof ApiError ? error.message : 'Could not place the order.'),
  });

  const askRates = useMutation({
    mutationFn: (input: {
      lines: Array<{ productId: string; quantity: number; note?: string }>;
      transporter?: string;
      note?: string;
      noteVoiceMediaId?: string;
      noteVoiceDurationMs?: number;
      noteImageUrls?: string[];
    }) => {
      const attach = placeNoteAttachFields(input);
      return api.post<OrderView & { threadId?: string | null }>('/orders', {
        sellerCompanyId:
          handlePath && facilitatorCompanyId ? facilitatorCompanyId : product.data!.company.id,
        kind: OrderKind.Standard,
        intent: OrderIntent.Inquiry,
        note: attach.note ?? (product.data?.name ? `Rates for ${product.data.name}` : undefined),
        noteVoiceMediaId: attach.noteVoiceMediaId,
        noteVoiceDurationMs: attach.noteVoiceDurationMs,
        noteImageUrls: attach.noteImageUrls,
        ...(input.transporter?.trim() ? { transporter: input.transporter.trim() } : {}),
        ...(handlePath
          ? { orderPathPreference: 'handle' as const }
          : { facilitatorCompanyId }),
        items: input.lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          images: [],
          ...(line.note?.trim() ? { note: line.note.trim() } : {}),
        })),
      });
    },
    onSuccess: (order) => {
      setQtyOpen(false);
      setOrderError(null);
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      showToast('Rate request sent');
      void navigateToOrderChat(navigate, queryClient, order, { replace: true });
    },
    onError: (error) =>
      setOrderError(error instanceof ApiError ? error.message : 'Could not ask for rates.'),
  });

  const preview = product.data;
  const previewOwner = Boolean(me.data?.id && preview && me.data.id === preview.company.id);
  usePageOwnsBottomBand(
    exploreProductTradeDock({
      visitor: !previewOwner,
      visible: Boolean(preview?.visible),
    }),
  );

  if (product.isLoading) {
    return <LoadingBlock label="Loading design…" />;
  }
  if (product.isError || !product.data) {
    return (
      <>
        <PageHeader title="Design" />
        <ErrorState message="This design isn't available." />
      </>
    );
  }

  const data = product.data;
  const notes = data.description?.trim();
  const isOwner = Boolean(me.data?.id && me.data.id === data.company.id);
  const canTrade = exploreProductTradeDock({ visitor: !isOwner, visible: data.visible });
  const canCurate = canTrade;
  const orderProduct = {
    id: data.id,
    name: data.name,
    images: data.images,
    moq: data.moq ?? null,
    companyId: data.company.id,
    categories: data.categories ?? [],
    rate: data.rate,
    rateMax: null,
    unit: data.unit,
  } as ProductView;

  const openCurate = () => {
    if (data.allowForward === false) {
      showToast(RELIST_LOCKED_TOAST, 'danger');
      return;
    }
    if (!shortlist.productIds.has(data.id)) {
      shortlist.addMany([
        {
          productId: data.id,
          name: data.name,
          thumbUrl: data.images[0] ?? null,
          companyId: data.company.id,
          companyName: data.company.name,
          allowForward: data.allowForward,
          categories: data.categories ?? [],
          unit: data.unit ?? null,
          moq: data.moq ?? null,
          rate: data.rate ?? null,
        },
      ]);
    }
    setCurateOpen(true);
  };

  const openQty = (job: 'order' | 'ask' = 'order') => {
    setOrderError(null);
    setQtyJob(job);
    setQtyOpen(true);
  };

  return (
    <div
      className={cx(
        'flex flex-col gap-3',
        (canTrade || canCurate) && SELECTION_DOCK_CLEARANCE_CLASS,
      )}
    >
      <PageHeader
        title={data.name}
        action={
          <button
            type="button"
            className="rounded-full px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent/5 disabled:opacity-45"
            disabled={!id || save.isPending}
            onClick={() => save.toggle()}
          >
            {save.isSaved ? 'Bookmarked' : 'Bookmark'}
          </button>
        }
      />

      {data.images.length > 0 ? (
        <button
          type="button"
          data-testid="design-hero-photo"
          aria-label="View photos"
          className="relative -mx-4 h-[min(42vh,22rem)] overflow-hidden bg-linen"
          onClick={() => {
            setPhotoIndex(0);
            setPhotoOpen(true);
          }}
        >
          <img
            src={toAbsoluteMediaUrl(data.images[0]) || data.images[0]}
            alt=""
            className="h-full w-full object-cover"
          />
          {data.images.length > 1 ? (
            <span className="absolute bottom-2 right-2 rounded-full bg-ink/70 px-2 py-0.5 text-[11px] font-semibold text-white">
              1/{data.images.length}
            </span>
          ) : null}
        </button>
      ) : (
        <div className="-mx-4 flex h-[min(42vh,22rem)] items-center justify-center bg-linen text-3xl font-bold text-muted">
          {data.name.charAt(0).toUpperCase()}
        </div>
      )}

      {data.visible ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-[15px] font-semibold tracking-tight text-ink">
            {formatCatalogRate({
              rate: data.rate,
              rateMax: data.rateMax,
              unit: data.unit,
              dispatchUnit: data.dispatchUnit,
            })}
            {data.moq != null && data.moq > 0 ? (
              <span className="ml-2 text-sm font-medium text-muted">· min {data.moq} pcs</span>
            ) : null}
          </p>
          {notes ? <p className="whitespace-pre-wrap text-sm text-ink">{notes}</p> : null}
          {data.categories && data.categories.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {data.categories.map((category) => (
                <Tag key={category}>{categoryDisplayLabel(category)}</Tag>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">Ask {data.company.name} to see full details and order.</p>
          {!isOwner ? (
            <Button
              fullWidth
              onClick={() => requestAccess.mutate(data.company.id)}
              disabled={requestAccess.isPending}
            >
              {requestAccess.isPending ? 'Sending…' : 'Request access'}
            </Button>
          ) : null}
        </div>
      )}

      <CompanyRow
        company={data.company}
        to={isOwner ? undefined : `/company/${data.company.id}`}
        plain
      />

      {canTrade || canCurate ? (
        <BottomTradeDock testId="explore-product-trade-dock" aboveAppNav={false}>
          {canCurate ? (
            <Button variant="secondary" fullWidth onClick={openCurate}>
              Repost
            </Button>
          ) : null}
          {canTrade ? (
            <>
              <Button variant="secondary" fullWidth onClick={() => openQty('ask')}>
                Ask for rates
              </Button>
              <Button fullWidth onClick={() => openQty('order')}>
                Order
              </Button>
            </>
          ) : null}
        </BottomTradeDock>
      ) : null}

      <HowManyEachSheet
        open={qtyOpen}
        onClose={() => setQtyOpen(false)}
        sellerId={data.company.id}
        products={[orderProduct]}
        submitting={createOrder.isPending}
        asking={askRates.isPending}
        error={orderError}
        sheetJob={qtyJob}
        orderGoesToName={
          stampedHandle
            ? (readCatalogHandlerName('product', id) ?? null)
            : data.company.name
        }
        onSendOrder={(lines, place) => {
          setOrderError(null);
          createOrder.mutate({ lines, ...place });
        }}
        onAskRates={(lines, place) => {
          setOrderError(null);
          askRates.mutate({ lines, ...place });
        }}
      />

      <CurateFromSelectionSheet open={curateOpen} onClose={() => setCurateOpen(false)} />

      <PhotoViewer
        open={photoOpen && data.images.length > 0}
        urls={data.images}
        index={photoIndex}
        onIndex={setPhotoIndex}
        onClose={() => setPhotoOpen(false)}
      />
    </div>
  );
}
