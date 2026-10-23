import { useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { MEDIA_VARIANT, type ExploreProductPreviewView, type ProductView } from '@ekum/domain-types';
import { orderWhoMode } from '@/features/orders/orderWho';
import { orderSheetTitle } from '@/features/orders/orderQtyUi';
import {
  QtyStepper,
  SameForAllEditor,
  sameForAllChipLabel,
  seedSameForAllQty,
} from '@/features/orders/QtyStepper';
import { applyHowManyDetail } from '@/features/orders/howManyHydrate';
import {
  HowManyLineHeading,
  HowManyQtyRow,
  HowManyRemoveButton,
} from '@/features/orders/HowManyLineHeading';
import { HowManyGroupedLines } from '@/features/orders/HowManyGroupedLines';
import {
  howManyOrderFooterSummary,
  howManyOrderUnitsMixed,
  howManyPackSizesDiffer,
  qtyCountNoun,
} from '@/features/orders/howManyLineMeta';
import { OrderLineStack } from '@/features/orders/OrderLineStack';
import { OrderQtyFooterSummary } from '@/features/orders/OrderQtyFooterSummary';
import { howManySingleGoesTo, howManySplitBanner } from '@/features/orders/howManySplitBanner';
import { api } from '@/lib/apiClient';
import { useMyCompany } from '@/lib/queries';
import { canNativeShare, shareOrCopyInvite } from '@/lib/shareInvite';
import { useTradePresence } from '@/lib/tradePresence';
import { useToast } from '@/ui/Toast';
import { HowManyLineNote } from '@/features/orders/HowManyLineNote';
import { Button, InlineNotice, Sheet } from '@/ui/kit';
import { PhotoViewer } from '@/ui/PhotoViewer';
import { ManagedImage } from '@/ui/ManagedImage';
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
import { NoteAttachField } from '@/features/voice/NoteAttachField';
import type { NoteVoiceValue } from '@/features/voice/NoteVoiceField';
import type { PlaceNoteAttach } from '@/features/orders/placeNoteAttach';
import { OrderForBuyerSheet } from './OrderForBuyerSheet';

export type HowManyLine = {
  productId: string;
  quantity: number;
  note?: string;
};

export type HowManyPlaceOpts = PlaceNoteAttach & {
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
  const [note, setNote] = useState('');
  const [noteVoice, setNoteVoice] = useState<NoteVoiceValue>(null);
  const [noteImages, setNoteImages] = useState<string[]>([]);
  const [attachBusy, setAttachBusy] = useState(false);

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
    setNote('');
    setNoteVoice(null);
    setNoteImages([]);
    setAttachBusy(false);
  }, [open, qtyKey, productKey, sheetJob]);

  /** Own-catalog How many: Order for buyer on; Choose buyer CTA opens picker (not auto). */
  useEffect(() => {
    if (!open) return;
    if (whoMode === 'buyer-only') setForBuyer(true);
  }, [open, whoMode, productKey]);

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
    const opts: HowManyPlaceOpts = {};
    const trimmed = transporter.trim();
    if (trimmed) opts.transporter = trimmed;
    const trimmedNote = note.trim();
    if (trimmedNote) opts.note = trimmedNote;
    if (noteVoice?.mediaId && noteVoice.durationMs) {
      opts.noteVoiceMediaId = noteVoice.mediaId;
      opts.noteVoiceDurationMs = noteVoice.durationMs;
    }
    if (noteImages.length > 0) opts.noteImageUrls = noteImages;
    return opts;
  };

  const persistTransporter = () => {
    const trimmed = transporter.trim();
    if (trimmed) rememberTransporter(trimmed, qtyKey);
  };

  const busy = Boolean(submitting || asking || attachBusy);
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
          <p className="text-sm text-muted">They open it, enter the code, then view the ticket.</p>
          <Button
            fullWidth
            onClick={async () => {
              try {
                const result = await shareOrCopyInvite({
                  url: inviteUrl,
                  title: 'Ekum — logged order',
                  text: 'View this order on Ekum',
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
    if (!next) setBuyerOpen(false);
  };

  const openChooseBuyer = () => {
    if (!canPlace) {
      showToast('Enter how many on each design first.', 'danger');
      return;
    }
    setBuyerOpen(true);
  };

  const footerSummary = howManyOrderFooterSummary(
    lines.map(({ product, quantity }) => ({
      quantity,
      unit: product.unit,
      piecesPerPack: product.piecesPerPack,
      dispatchUnit: product.dispatchUnit,
      rate: product.rate ?? null,
    })),
  );
  const packSizesDiffer = howManyPackSizesDiffer(activeProducts);
  const unitsMixed = howManyOrderUnitsMixed(activeProducts);
  const showSameForAll = activeProducts.length > 1 && !unitsMixed;

  const showTicketExtras =
    sheetJob === 'ask' ||
    (sheetJob === 'order' && (showPlaceOrder || canOrderForBuyer));

  /** Sticky: qty/₹ + primary CTA only — Note / transporter / buyer live in the scroll. */
  const decideFooter = (
    <div className="flex flex-col gap-2.5" data-testid="how-many-footer">
      {footerSummary ? <OrderQtyFooterSummary summary={footerSummary} /> : null}
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
      {forBuyer && canOrderForBuyer ? (
        <Button
          fullWidth
          data-testid="how-many-choose-buyer"
          disabled={busy || !canPlace}
          onClick={() => {
            const qty = lines[0]?.quantity;
            if (qty != null) persistQty(qty);
            persistTransporter();
            openChooseBuyer();
          }}
        >
          Choose buyer
        </Button>
      ) : null}
    </div>
  );

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        title={sheetTitle}
        footer={decideFooter}
      >
        <div className="flex flex-col gap-4 pb-1">
          {splitBanner ? (
            <p
              data-testid="how-many-split"
              className="rounded-xl border border-line bg-foam px-3.5 py-2.5 text-[14px] font-emphasis leading-snug text-ink"
            >
              {splitBanner}
            </p>
          ) : goesTo ? (
            <p className="rounded-xl border border-line bg-foam px-3.5 py-2.5 text-[14px] font-emphasis leading-snug text-ink">
              Order goes to <span className="font-emphasis">{goesTo}</span>
            </p>
          ) : null}
          {showSameForAll ? (
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
                className="inline-flex w-fit items-center rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-emphasis tracking-tight text-ink disabled:opacity-45"
                onClick={() => {
                  setSameDraft(
                    seedSameForAllQty(Object.values(overrides), sharedQty),
                  );
                  setSameOpen(true);
                }}
              >
                {sameForAllChipLabel(sharedQty)}
              </button>
            )
          ) : null}

          <HowManyGroupedLines
            items={lines}
            unitOf={(line) => line.product.unit}
            getKey={(line) => line.product.id}
            testId="how-many-lines"
            lineTestId="how-many-line"
            renderLine={({ product, quantity }, _index, last) => {
              const thumbs = howManyPhotoUrls(product);
              const thumb = thumbs[0] ?? null;
              const noteValue = notes[product.id] ?? '';
              const noun = qtyCountNoun(product.unit);
              return (
                <>
                  <OrderLineStack
                    trailingBelow
                    photo={
                      thumb ? (
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
                          <ManagedImage src={thumb} alt="" variant={MEDIA_VARIANT.Thumbnail1} className="h-full w-full object-cover" />
                        </button>
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-foam text-sm font-body text-muted">
                          {product.name.charAt(0)}
                        </div>
                      )
                    }
                    title={
                      <HowManyLineHeading
                        name={product.name}
                        unit={product.unit}
                        dispatchUnit={product.dispatchUnit}
                        catalogRateUnit={product.catalogRateUnit}
                        piecesPerPack={product.piecesPerPack}
                        moq={product.moq}
                        rate={product.rate}
                        rateMax={product.rateMax}
                        shop={multiShop ? product.companyName : null}
                        showPackSize={packSizesDiffer}
                      />
                    }
                    nameEnd={
                      canRemove ? (
                        <HowManyRemoveButton
                          name={product.name}
                          disabled={busy}
                          onClick={() => {
                            setRemoved((prev) => new Set(prev).add(product.id));
                            onRemoveProduct?.(product.id);
                          }}
                        />
                      ) : null
                    }
                    trailing={
                      <HowManyQtyRow
                        unit={product.unit}
                        piecesPerPack={product.piecesPerPack}
                        stepper={
                          <QtyStepper
                            value={quantity}
                            disabled={busy}
                            chainQty
                            enterKeyHint={last ? 'done' : 'next'}
                            aria-label={`${noun} for ${product.name}`}
                            onChange={(next) => {
                              setOverrides((prev) => ({ ...prev, [product.id]: next }));
                              if (next != null) persistQty(next);
                            }}
                          />
                        }
                      />
                    }
                  />
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
                </>
              );
            }}
          />

          {showTicketExtras ? (
            <div
              className="flex flex-col gap-2.5"
              data-testid="how-many-extras"
            >
              <NoteAttachField
                label="Note"
                note={note}
                onNoteChange={setNote}
                voice={noteVoice}
                onVoiceChange={setNoteVoice}
                images={noteImages}
                onImagesChange={setNoteImages}
                onBusyChange={setAttachBusy}
                collapseEmpty
              />
              <TransporterField
                value={transporter}
                onChange={setTransporter}
                disabled={busy}
                compact
              />
              {showBuyerToggle ? (
                <CantSupplySwitch
                  checked={forBuyer}
                  busy={busy}
                  onChange={setOrderForBuyer}
                  testId="how-many-order-for-buyer"
                  label="Order for buyer"
                />
              ) : null}
            </div>
          ) : null}

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
          if (whoMode !== 'buyer-only') setForBuyer(false);
        }}
        lines={payload()}
        productIds={activeProducts.map((product) => product.id)}
        transporter={transporter.trim() || undefined}
        onInvite={(url) => {
          persistTransporter();
          setBuyerOpen(false);
          if (whoMode !== 'buyer-only') setForBuyer(false);
          setInviteUrl(url);
        }}
        onDone={() => {
          persistTransporter();
          setBuyerOpen(false);
          if (whoMode !== 'buyer-only') setForBuyer(false);
          onClose();
        }}
      />
    </>
  );
}
