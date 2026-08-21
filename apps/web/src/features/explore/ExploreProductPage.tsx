import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  OrderIntent,
  OrderKind,
  type ExploreProductPreviewView,
  type OrderView,
  type ProductView,
} from '@ekum/domain-types';
import { CurateFromSelectionSheet } from '@/features/browse/CurateFromSelectionSheet';
import { FORWARD_LOCKED_TOAST } from '@/features/browse/forwardGate';
import {
  resolveFacilitatorForCatalog,
  resolveOrderPathForCatalog,
} from '@/features/browse/forwardAttribution';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import { HowManyEachSheet } from '@/features/orders/HowManyEachSheet';
import { useSaveToggle } from '@/features/saved/useSaveToggle';
import { api, ApiError } from '@/lib/apiClient';
import { formatRate } from '@/lib/format';
import { useMyCompany } from '@/lib/queries';
import { PageHeader } from '@/ui/PageHeader';
import { useToast } from '@/ui/Toast';
import { Button, Card, ErrorState, LoadingBlock, Tag, cx } from '@/ui/kit';
import { CompanyRow } from '@/ui/cards';

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
  const handlePath = stampedPath === 'handle' && Boolean(facilitatorCompanyId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const me = useMyCompany();
  const shortlist = useBrowseShortlist();
  const [qtyOpen, setQtyOpen] = useState(false);
  const [curateOpen, setCurateOpen] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const product = useQuery({
    queryKey: ['explore', 'product', id],
    queryFn: () => api.get<ExploreProductPreviewView>(`/explore/products/${id}`),
    enabled: Boolean(id),
  });
  const save = useSaveToggle({ productId: id });

  const createOrder = useMutation({
    mutationFn: (lines: Array<{ productId: string; quantity: number }>) =>
      api.post<OrderView & { threadId?: string | null }>('/orders', {
        sellerCompanyId:
          handlePath && facilitatorCompanyId ? facilitatorCompanyId : product.data!.company.id,
        kind: OrderKind.Standard,
        ...(handlePath
          ? { orderPathPreference: 'handle' as const }
          : { facilitatorCompanyId }),
        items: lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          images: [],
        })),
      }),
    onSuccess: (order) => {
      setQtyOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (order.threadId) {
        navigate(`/chats/${order.threadId}`, { replace: true });
      } else {
        navigate(`/orders/${order.id}`, { replace: true });
      }
    },
    onError: (error) =>
      setOrderError(error instanceof ApiError ? error.message : 'Could not place the order.'),
  });

  const askRates = useMutation({
    mutationFn: (lines: Array<{ productId: string; quantity: number }>) =>
      api.post<OrderView & { threadId?: string | null }>('/orders', {
        sellerCompanyId:
          handlePath && facilitatorCompanyId ? facilitatorCompanyId : product.data!.company.id,
        kind: OrderKind.Standard,
        intent: OrderIntent.Inquiry,
        note: product.data?.name ? `Rates for ${product.data.name}` : undefined,
        ...(handlePath
          ? { orderPathPreference: 'handle' as const }
          : { facilitatorCompanyId }),
        items: lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          images: [],
        })),
      }),
    onSuccess: (order) => {
      setQtyOpen(false);
      setOrderError(null);
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      showToast('Ask for rates sent');
      if (order.threadId) {
        navigate(`/chats/${order.threadId}`, { replace: true });
      } else {
        navigate(`/orders/${order.id}`, { replace: true });
      }
    },
    onError: (error) =>
      setOrderError(error instanceof ApiError ? error.message : 'Could not ask for rates.'),
  });

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
  const canTrade = data.visible && !isOwner;
  const canCurate = data.visible && !isOwner;
  const orderProduct = {
    id: data.id,
    name: data.name,
    images: data.images,
    moq: data.moq ?? null,
  } as ProductView;

  const openCurate = () => {
    if (data.allowForward === false) {
      showToast(FORWARD_LOCKED_TOAST, 'danger');
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
        },
      ]);
    }
    setCurateOpen(true);
  };

  const openQty = () => {
    setOrderError(null);
    setQtyOpen(true);
  };

  return (
    <div className={cx('flex flex-col gap-4', (canTrade || canCurate) && 'pb-[calc(5rem+4.5rem)]')}>
      <PageHeader
        title={data.name}
        action={
          <button
            type="button"
            className="rounded-full px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent/5 disabled:opacity-45"
            disabled={!id || save.isPending}
            onClick={() => save.toggle()}
          >
            {save.isSaved ? 'Saved' : 'Save'}
          </button>
        }
      />

      {data.images.length > 0 ? (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1">
          {data.images.map((image) => (
            <img
              key={image}
              src={image}
              alt={data.name}
              className="h-56 w-44 shrink-0 rounded-2xl object-cover"
            />
          ))}
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-2xl bg-foam text-3xl font-bold text-muted">
          {data.name.charAt(0).toUpperCase()}
        </div>
      )}

      <CompanyRow company={data.company} to={`/company/${data.company.id}`} />

      <Card className="flex flex-col gap-3">
        {data.visible ? (
          <>
            <span className="text-lg font-semibold text-ink">
              {formatRate(data.rate, data.unit)}
            </span>
            {data.moq != null && data.moq > 0 ? (
              <p className="text-sm font-medium text-ink">Minimum order · {data.moq} pcs</p>
            ) : null}
            {notes ? (
              <div className="flex flex-col gap-1">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">Notes</p>
                <p className="whitespace-pre-wrap text-sm text-ink">{notes}</p>
              </div>
            ) : null}
            {data.categories && data.categories.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {data.categories.map((category) => (
                  <Tag key={category}>{category}</Tag>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-muted">
            Connect with {data.company.name} to see full details and order.
          </p>
        )}
        <Link to={`/company/${data.company.id}`} className="text-sm font-bold text-accent">
          View business →
        </Link>
      </Card>

      {canTrade || canCurate ? (
        <div className="fixed inset-x-0 bottom-20 z-30 mx-auto flex max-w-md gap-2 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur">
          {canCurate ? (
            <Button variant="secondary" fullWidth onClick={openCurate}>
              Curate
            </Button>
          ) : null}
          {canTrade ? (
            <>
              <Button variant="secondary" fullWidth onClick={openQty}>
                Ask for rates
              </Button>
              <Button fullWidth onClick={openQty}>
                Order
              </Button>
            </>
          ) : null}
        </div>
      ) : null}

      <HowManyEachSheet
        open={qtyOpen}
        onClose={() => setQtyOpen(false)}
        sellerId={data.company.id}
        products={[orderProduct]}
        submitting={createOrder.isPending}
        asking={askRates.isPending}
        error={orderError}
        orderGoesToName={handlePath ? null : data.company.name}
        onSendOrder={(lines) => {
          setOrderError(null);
          createOrder.mutate(lines);
        }}
        onAskRates={(lines) => {
          setOrderError(null);
          askRates.mutate(lines);
        }}
      />

      <CurateFromSelectionSheet open={curateOpen} onClose={() => setCurateOpen(false)} />
    </div>
  );
}
