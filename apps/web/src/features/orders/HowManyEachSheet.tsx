import { useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import type { ExploreProductPreviewView, ProductView } from '@ekum/domain-types';
import { orderWhoMode } from '@/features/orders/orderWho';
import { orderSheetTitle } from '@/features/orders/orderQtyUi';
import {
  QtyStepper,
  SameForAllEditor,
  sameForAllChipLabel,
} from '@/features/orders/QtyStepper';
import { applyHowManyDetail } from '@/features/orders/howManyHydrate';
import { HowManyLineHeading } from '@/features/orders/HowManyLineHeading';
import {
  howManyOrderFooterSummary,
  howManySetsBanner,
  howManyTotalPcsLabel,
  qtyCountNoun,
  qtyStepperUnitLabel,
} from '@/features/orders/howManyLineMeta';
import { howManySingleGoesTo, howManySplitBanner } from '@/features/orders/howManySplitBanner';
import { api } from '@/lib/apiClient';
import { useMyCompany } from '@/lib/queries';
import { canNativeShare, shareOrCopyInvite } from '@/lib/shareInvite';
import { useTradePresence } from '@/lib/tradePresence';
import { useToast } from '@/ui/Toast';
import { HowManyLineNote } from '@/features/orders/HowManyLineNote';
import { Button, InlineNotice, Sheet, cx } from '@/ui/kit';
import { PhotoViewer } from '@/ui/PhotoViewer';
import { ORDER_QTY_SCOPE_ATTR } from '@/features/orders/orderQtyFocus';
import { readRememberedQty, rememberQty } from '@/features/orders/qtyEachMemory';
import {
  readLastTransporter,
  rememberTransporter,
} from '@/features/orders/transporterMemory';
import { TransporterField } from '@/features/orders/TransporterField';
import {
  galleryIndexForProduct,
  howManyGalleryCaptions,
  howManyGalleryDetails,
  howManyGalleryUrls,
  howManyPhotoUrls,
} from '@/features/orders/howManySheetPhotos';
import { CantSupplySwitch } from '@/features/orders/CantSupplySwitch';
import { howManyFooterSlots } from '@/features/orders/howManyFooterSlots';
import { OrderForBuyerSheet } from './OrderForBuyerSheet';

export type HowManyLine = {
  productId: string;
  quantity: number;
  note?: string;
};

export type HowManyPlaceOpts = {
  transporter?: string;
};

export function HowManyEachSheet({
  open,
  onClose,
  sellerId,
  products,
  submitting,
  asking,
  error,
  onSendOrder,
  onAskRates,
  orderGoesToName,
  onRemoveProduct,
  sheetJob = 'order',
}: {
  open: boolean;
  onClose: () => void;
  sellerId: string;
  products: ProductView[];
  submitting?: boolean;
  asking?: boolean;
  error?: string | null;
  onSendOrder: (lines: HowManyLine[], opts?: HowManyPlaceOpts) => void;
  onAskRates: (lines: HowManyLine[], opts?: HowManyPlaceOpts) => void;
  orderGoesToName?: string | null;
  /** × also updates traveling Selection (sr 42). */
  onRemoveProduct?: (productId: string) => void;
  /**
   * `order` — Place Order (+ Order for buyer switch). No Share / Ask.
   * `ask` — Ask rates only (shop / design Ask dock).
   */
  sheetJob?: 'order' | 'ask';
}) {
  const { selling, trading } = useTradePresence();
  const me = useMyCompany();
  const { showToast } = useToast();
  const details = useQueries({
    queries: products.map((product) => ({
      queryKey: ['explore-product', product.id],
      queryFn: () => api.get<ExploreProductPreviewView>(`/explore/products/${product.id}`),
      enabled: open && Boolean(product.id),
      staleTime: 60_000,
      retry: false,
    })),
  });
  const catalogProducts = useMemo(
    () => products.map((product, index) => applyHowManyDetail(product, details[index]?.data)),
    [products, details],
  );
  const whoMode = orderWhoMode({
    canLogForBuyer: selling || trading,
    actorCompanyId: me.data?.id ?? '',
    productCompanyIds: catalogProducts.map((product) => product.companyId),
  });
  const canOrderForBuyer = whoMode !== 'hidden';
  /** Own-catalog log path hides Place; foreign / pure-buyer keeps it. */
  const showPlaceOrder = sheetJob === 'order' && whoMode !== 'buyer-only';
  const footerSlots = howManyFooterSlots({
    sheetJob,
    showPlaceOrder: whoMode !== 'buyer-only',
    canOrderForBuyer,
  });
  const showBuyerToggle = footerSlots.includes('order-buyer-toggle');
  const showPlaceButton = footerSlots.includes('place');
  const showAskButton = footerSlots.includes('ask');

  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [buyerOpen, setBuyerOpen] = useState(false);
  const [forBuyer, setForBuyer] = useState(false);
  const [sharedQty, setSharedQty] = useState<number | null>(null);
  const [overrides, setOverrides] = useState<Record<string, number | null>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [removed, setRemoved] = useState<Set<string>>(() => new Set());
  const [sameOpen, setSameOpen] = useState(false);
  const [sameDraft, setSameDraft] = useState<number | null>(null);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [transporter, setTransporter] = useState('');

  const productKey = catalogProducts.map((product) => product.id).join(',');
  const qtyKey = sellerId || 'multi';

  useEffect(() => {
    if (!open) return;
    const remembered = readRememberedQty(qtyKey);
    setSharedQty(remembered);
    setSameDraft(remembered);
    setOverrides({});
    setNotes({});
    setRemoved(new Set());
    setSameOpen(false);
    setPhotoOpen(false);
    setBuyerOpen(false);
    setForBuyer(false);
    setInviteUrl(null);
    setTransporter(readLastTransporter(qtyKey) ?? '');
  }, [open, qtyKey, productKey, sheetJob]);

  const activeProducts = useMemo(
    () => catalogProducts.filter((product) => !removed.has(product.id)),
    [catalogProducts, removed],
  );

  const lines = useMemo(
    () =>
      activeProducts.map((product) => ({
        product,
        quantity: Object.prototype.hasOwnProperty.call(overrides, product.id)
          ? overrides[product.id]
          : sharedQty,
        note: notes[product.id]?.trim() || undefined,
      })),
    [activeProducts, overrides, sharedQty, notes],
  );

  const persistQty = (qty: number) => {
    rememberQty(qtyKey, qty);
  };

  const applyShared = (qty: number | null) => {
    if (qty == null || qty <= 0) return;
    setSharedQty(qty);
    setSameDraft(qty);
    setOverrides({});
    setSameOpen(false);
    persistQty(qty);
  };

  const cancelSame = () => {
    setSameDraft(sharedQty);
    setSameOpen(false);
  };

  const payload = (): HowManyLine[] =>
    lines.flatMap((line) =>
      line.quantity != null && line.quantity >= 1
        ? [
            {
              productId: line.product.id,
              quantity: line.quantity,
              ...(line.note ? { note: line.note } : {}),
            },
          ]
        : [],
    );

  const canPlace = lines.length > 0 && lines.every((line) => line.quantity != null && line.quantity >= 1);

  const placeOpts = (): HowManyPlaceOpts => {
    const trimmed = transporter.trim();
    return trimmed ? { transporter: trimmed } : {};
  };

  const persistTransporter = () => {
    const trimmed = transporter.trim();
    if (trimmed) rememberTransporter(trimmed, qtyKey);
  };

  const busy = Boolean(submitting || asking);
  const splitBanner = sellerId === 'multi' ? howManySplitBanner(activeProducts) : null;
  const goesTo =
    sellerId === 'multi'
      ? howManySingleGoesTo(activeProducts, orderGoesToName)
      : orderGoesToName?.trim() || null;
  const multiShop = Boolean(splitBanner);
  const sheetTitle = orderSheetTitle(activeProducts.length);
  const canRemove = activeProducts.length > 1;
  const photoGallery = useMemo(() => howManyGalleryUrls(activeProducts), [activeProducts]);
  const photoCaptions = useMemo(() => howManyGalleryCaptions(activeProducts), [activeProducts]);
  const photoDetails = useMemo(() => howManyGalleryDetails(activeProducts), [activeProducts]);

  if (inviteUrl) {
    return (
      <Sheet open={open} onClose={onClose} title="Send this link">
        <div className="flex flex-col gap-3 pb-1">
          <p className="text-sm text-muted">They open it, enter the code, then Accept.</p>
          <Button
            fullWidth
            onClick={async () => {
              try {
                const result = await shareOrCopyInvite({
                  url: inviteUrl,
                  title: 'Ekum — accept order',
                  text: 'Accept this order on Ekum',
                });
                if (result === 'copied') showToast('Link copied');
              } catch (err) {
                if (err instanceof DOMException && err.name === 'AbortError') return;
                showToast('Could not share the link.', 'danger');
              }
            }}
          >
            {canNativeShare() ? 'Share link' : 'Copy link'}
          </Button>
        </div>
      </Sheet>
    );
  }

  const setOrderForBuyer = (next: boolean) => {
    setForBuyer(next);
    if (next) {
      if (!canPlace) {
        showToast('Enter how many on each design first.', 'danger');
        setForBuyer(false);
        return;
      }
      setBuyerOpen(true);
      return;
    }
    setBuyerOpen(false);
  };

  const footerSummary = howManyOrderFooterSummary(
    lines.map(({ product, quantity }) => ({
      quantity,
      unit: product.unit,
      piecesPerPack: product.piecesPerPack,
      dispatchUnit: product.dispatchUnit,
    })),
  );
  const setsBanner = howManySetsBanner(activeProducts);

  const decideFooter = (
    <div className="flex flex-col gap-4" data-testid="how-many-footer">
      {footerSummary ? (
        <div data-testid="how-many-sets-summary" className="flex flex-col gap-0.5">
          <p className="text-[15px] font-bold tracking-tight text-ink">{footerSummary.primary}</p>
          {footerSummary.hint ? (
            <p className="text-[12px] font-medium text-muted">{footerSummary.hint}</p>
          ) : null}
        </div>
      ) : null}
      {sheetJob === 'order' && (showPlaceOrder || canOrderForBuyer) ? (
        <TransporterField value={transporter} onChange={setTransporter} disabled={busy} />
      ) : sheetJob === 'ask' ? (
        <TransporterField value={transporter} onChange={setTransporter} disabled={busy} />
      ) : null}
      <div className="flex flex-col gap-3">
        {showBuyerToggle ? (
          <CantSupplySwitch
            checked={forBuyer}
            busy={busy}
            onChange={setOrderForBuyer}
            testId="how-many-order-for-buyer"
            label="Order for buyer"
          />
        ) : null}
        {showAskButton ? (
          <Button
            fullWidth
            data-testid="how-many-ask-rates"
            disabled={busy || !canPlace}
            onClick={() => {
              const qty = lines[0]?.quantity;
              if (qty != null) persistQty(qty);
              persistTransporter();
              onAskRates(payload(), placeOpts());
            }}
          >
            {asking ? 'Opening…' : 'Ask rates'}
          </Button>
        ) : null}
        {showPlaceButton && !forBuyer ? (
          <Button
            fullWidth
            data-testid="how-many-place-order"
            disabled={busy || !canPlace}
            onClick={() => {
              const qty = lines[0]?.quantity;
              if (qty != null) persistQty(qty);
              persistTransporter();
              onSendOrder(payload(), placeOpts());
            }}
          >
            {submitting ? 'Sending…' : 'Place Order'}
          </Button>
        ) : null}
      </div>
    </div>
  );

  return (
    <>
      <Sheet open={open} onClose={onClose} title={sheetTitle} footer={decideFooter}>
        <div className="flex flex-col gap-4 pb-1">
          {splitBanner ? (
            <p
              data-testid="how-many-split"
              className="rounded-xl border border-line bg-foam px-3.5 py-2.5 text-[14px] font-medium leading-snug text-ink"
            >
              {splitBanner}
            </p>
          ) : goesTo ? (
            <p className="rounded-xl border border-line bg-foam px-3.5 py-2.5 text-[14px] font-medium leading-snug text-ink">
              Order goes to <span className="font-semibold">{goesTo}</span>
            </p>
          ) : null}
          {setsBanner ? (
            <p
              data-testid="how-many-sets-banner"
              className="text-[13px] font-medium leading-snug text-muted"
            >
              {setsBanner}
            </p>
          ) : null}

          {activeProducts.length > 1 ? (
            sameOpen ? (
              <SameForAllEditor
                disabled={busy || sameDraft == null || sameDraft <= 0}
                onApply={() => applyShared(sameDraft)}
                onCancel={cancelSame}
              >
                <QtyStepper
                  autoFocus
                  value={sameDraft}
                  disabled={busy}
                  aria-label="Same quantity for all designs"
                  onChange={setSameDraft}
                />
              </SameForAllEditor>
            ) : (
              <button
                type="button"
                disabled={busy}
                data-testid="same-for-all-chip"
                className="inline-flex w-fit items-center rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-bold tracking-tight text-ink disabled:opacity-45"
                onClick={() => {
                  setSameDraft(null);
                  setSameOpen(true);
                }}
              >
                {sameForAllChipLabel(sharedQty)}
              </button>
            )
          ) : null}

          <ul
            className="overflow-x-hidden rounded-xl border border-line bg-surface"
            data-testid="how-many-lines"
            {...{ [ORDER_QTY_SCOPE_ATTR]: '' }}
          >
            {lines.map(({ product, quantity }, index) => {
              const thumbs = howManyPhotoUrls(product);
              const thumb = thumbs[0] ?? null;
              const noteValue = notes[product.id] ?? '';
              const noun = qtyCountNoun(product.unit);
              const unitLabel = qtyStepperUnitLabel(product.unit);
              const totalPcs = howManyTotalPcsLabel(
                quantity,
                product.unit,
                product.piecesPerPack,
                product.dispatchUnit,
              );
              return (
                <li
                  key={product.id}
                  className={cx('px-3 py-3', index > 0 && 'border-t border-line/70')}
                  data-testid="how-many-line"
                >
                  <div className="flex items-start gap-2.5">
                    {thumb ? (
                      <button
                        type="button"
                        data-testid={`how-many-photo-${product.id}`}
                        className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-foam"
                        aria-label={`View photo for ${product.name}`}
                        onClick={() => {
                          setPhotoIndex(galleryIndexForProduct(activeProducts, product.id));
                          setPhotoOpen(true);
                        }}
                      >
                        <img src={thumb} alt="" className="h-full w-full object-cover" />
                      </button>
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-foam text-sm font-bold text-muted">
                        {product.name.charAt(0)}
                      </div>
                    )}
                    <HowManyLineHeading
                      name={product.name}
                      unit={product.unit}
                      dispatchUnit={product.dispatchUnit}
                      piecesPerPack={product.piecesPerPack}
                      moq={product.moq}
                      rate={product.rate}
                      rateMax={product.rateMax}
                      shop={multiShop ? product.companyName : null}
                    />
                    <div className="flex shrink-0 flex-col items-end gap-1">
                    <QtyStepper
                      value={quantity}
                      disabled={busy}
                      chainQty
                      unitLabel={unitLabel}
                      enterKeyHint={index === lines.length - 1 ? 'done' : 'next'}
                      aria-label={`${noun} for ${product.name}`}
                      onChange={(next) => {
                        setOverrides((prev) => ({ ...prev, [product.id]: next }));
                        if (next != null) persistQty(next);
                      }}
                    />
                    {totalPcs ? (
                      <p className="text-[11px] font-medium text-muted" data-testid="how-many-total-pcs">
                        {totalPcs}
                      </p>
                    ) : null}
                    </div>
                    {canRemove ? (
                      <button
                        type="button"
                        disabled={busy}
                        aria-label={`Remove ${product.name}`}
                        className="shrink-0 px-1 text-lg leading-none text-muted disabled:opacity-45"
                        onClick={() => {
                          setRemoved((prev) => new Set(prev).add(product.id));
                          onRemoveProduct?.(product.id);
                        }}
                      >
                        ×
                      </button>
                    ) : null}
                  </div>
                  <HowManyLineNote
                    value={noteValue}
                    disabled={busy}
                    ariaLabel={`Note for ${product.name}`}
                    onChange={(next) =>
                      setNotes((prev) => ({
                        ...prev,
                        [product.id]: next,
                      }))
                    }
                  />
                </li>
              );
            })}
          </ul>

          {error ? <InlineNotice message={error} /> : null}
        </div>
      </Sheet>

      <PhotoViewer
        open={photoOpen && photoGallery.length > 0}
        urls={photoGallery}
        index={photoIndex}
        onIndex={setPhotoIndex}
        onClose={() => setPhotoOpen(false)}
        captions={photoCaptions}
        details={photoDetails}
      />

      <OrderForBuyerSheet
        open={buyerOpen}
        onClose={() => {
          setBuyerOpen(false);
          setForBuyer(false);
        }}
        lines={payload()}
        productIds={activeProducts.map((product) => product.id)}
        transporter={transporter.trim() || undefined}
        onInvite={(url) => {
          persistTransporter();
          setBuyerOpen(false);
          setForBuyer(false);
          setInviteUrl(url);
        }}
        onDone={() => {
          persistTransporter();
          setBuyerOpen(false);
          setForBuyer(false);
          onClose();
        }}
      />
    </>
  );
}
