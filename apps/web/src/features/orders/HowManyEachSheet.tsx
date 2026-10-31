import { useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import {
  catalogBunchBill,
  collapseCatalogWholeLines,
  lineBillAmount,
  MEDIA_VARIANT,
  type ExploreProductPreviewView,
  type ProductView,
} from '@ekum/domain-types';
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
import { HowManyCatalogBlock, type HowManyCatalogProduct } from '@/features/orders/HowManyCatalogBlock';
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
  companyId?: string;
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
  collectionId,
  onRemoveProduct,
  lockedProductIds,
  sheetJob = 'order',
  forBuyerProducts,
}: {
  open: boolean;
  onClose: () => void;
  sellerId: string;
  products: ProductView[];
  /** Mixed Place: Order for buyer uses remaining Direct + I-handle lines. */
  forBuyerProducts?: ProductView[];
  submitting?: boolean;
  asking?: boolean;
  error?: string | null;
  onSendOrder: (lines: HowManyLine[], opts?: HowManyPlaceOpts) => void;
  onAskRates: (lines: HowManyLine[], opts?: HowManyPlaceOpts) => void;
  orderGoesToName?: string | null;
  /** Curated pack Place / Order for buyer — same id as from-pack. */
  collectionId?: string;
  /** × also updates traveling Selection (sr 42). */
  onRemoveProduct?: (productId: string) => void;
  /** Whole-catalog members cannot be dropped from How many. */
  lockedProductIds?: string[];
  /**
   * `order` — Place Order (+ Order for buyer switch). No Share / Ask.
   * `ask` — Ask rates only (shop / design Ask dock).
   */
  sheetJob?: 'order' | 'ask';
}) {
  const { selling, trading } = useTradePresence();
  const me = useMyCompany();
  const { showToast } = useToast();
  const detailProducts =
    forBuyerProducts && forBuyerProducts.length > 0 ? forBuyerProducts : products;
  const details = useQueries({
    queries: detailProducts.map((product) => ({
      queryKey: ['explore-product', product.id],
      queryFn: () => api.get<ExploreProductPreviewView>(`/explore/products/${product.id}`),
      enabled: open && Boolean(product.id),
      staleTime: 60_000,
      retry: false,
    })),
  });
  const catalogProducts = useMemo(
    () =>
      detailProducts.map((product, index) => applyHowManyDetail(product, details[index]?.data)),
    [detailProducts, details],
  );
  const whoMode = orderWhoMode({
    canLogForBuyer: selling || trading,
    actorCompanyId: me.data?.id ?? '',
    sellerCompanyId: sellerId,
  });
  const canOrderForBuyer = whoMode !== 'hidden';
  /** Own shop log path hides Place; peer pack / mill keeps it. */
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

  const activeProducts = useMemo(() => {
    const waveIds = new Set(products.map((product) => product.id));
    const source =
      forBuyer && (forBuyerProducts?.length ?? 0) > 0
        ? catalogProducts
        : catalogProducts.filter((product) => waveIds.has(product.id));
    return source.filter((product) => !removed.has(product.id));
  }, [catalogProducts, removed, forBuyer, forBuyerProducts, products]);

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
              ...(line.product.companyId ? { companyId: line.product.companyId } : {}),
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
  const displayRows = useMemo(
    () => collapseCatalogWholeLines(activeProducts as HowManyCatalogProduct[]),
    [activeProducts],
  );
  const catalogOnly =
    displayRows.length === 1 && displayRows[0]?.kind === 'catalog';
  const sheetTitle = orderSheetTitle(activeProducts.length, {
    catalogOnly,
    catalogName: catalogOnly && displayRows[0]?.kind === 'catalog' ? displayRows[0].catalogName : null,
  });
  const lockedSet = useMemo(() => new Set(lockedProductIds ?? []), [lockedProductIds]);
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

  const footerSummary = (() => {
    const catalogRows = displayRows.filter((row) => row.kind === 'catalog');
    const loose = displayRows.filter((row) => row.kind === 'line');
    if (catalogRows.length === 0) {
      return howManyOrderFooterSummary(
        lines.map(({ product, quantity }) => ({
          quantity,
          unit: product.unit,
          piecesPerPack: product.piecesPerPack,
          dispatchUnit: product.dispatchUnit,
          catalogRateUnit: product.catalogRateUnit,
          rate: product.rate ?? null,
        })),
      );
    }
    const synthetic: Parameters<typeof howManyOrderFooterSummary>[0] = [];
    let money: number | null = 0;
    for (const row of catalogRows) {
      if (row.kind !== 'catalog') continue;
      const lead = row.items[0];
      const qty = lines.find((line) => line.product.id === lead?.id)?.quantity ?? null;
      if (qty == null || qty < 1 || !lead) {
        money = null;
        continue;
      }
      synthetic.push({
        quantity: qty,
        unit: lead.unit,
        piecesPerPack: lead.piecesPerPack,
        dispatchUnit: lead.dispatchUnit,
        catalogRateUnit: lead.catalogRateUnit,
        rate: lead.rate ?? null,
      });
      const bunch = catalogBunchBill({
        quantity: qty,
        rate: lead.rate ?? null,
        unit: lead.unit,
        catalogRateUnit: lead.catalogRateUnit,
        piecesPerPack: lead.piecesPerPack,
        memberCount: row.items.length,
      });
      if (bunch == null || money == null) money = null;
      else money += bunch;
    }
    for (const row of loose) {
      if (row.kind !== 'line') continue;
      const line = lines.find((item) => item.product.id === row.item.id);
      const qty = line?.quantity ?? null;
      synthetic.push({
        quantity: qty,
        unit: row.item.unit,
        piecesPerPack: row.item.piecesPerPack,
        dispatchUnit: row.item.dispatchUnit,
        catalogRateUnit: row.item.catalogRateUnit,
        rate: row.item.rate ?? null,
      });
      if (qty == null || qty < 1) {
        money = null;
        continue;
      }
      const amount = lineBillAmount({
        quantity: qty,
        rate: row.item.rate ?? null,
        unit: row.item.unit,
        piecesPerPack: row.item.piecesPerPack,
      });
      if (amount == null || money == null) money = null;
      else money += amount;
    }
    const base = howManyOrderFooterSummary(synthetic);
    if (!base) return base;
    if (money == null || money <= 0) return { rows: base.rows };
    return { rows: base.rows, money: `₹${money.toLocaleString('en-IN')}` };
  })();
  const packSizesDiffer = howManyPackSizesDiffer(activeProducts);
  const unitsMixed = howManyOrderUnitsMixed(activeProducts);
  const showSameForAll =
    activeProducts.length > 1 && !unitsMixed && displayRows.every((row) => row.kind === 'line');
  const looseLines = lines.filter((line) =>
    displayRows.some((row) => row.kind === 'line' && row.item.id === line.product.id),
  );

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
                className="inline-flex w-fit items-center rounded-full border border-line bg-surface px-3.5 py-2 text-meta font-emphasis tracking-tight text-ink disabled:opacity-45"
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

          <div className="flex flex-col gap-4" data-testid="how-many-lines">
          {displayRows.map((row) => {
            if (row.kind !== 'catalog') return null;
            const qty =
              lines.find((line) => line.product.id === row.items[0]?.id)?.quantity ?? sharedQty;
            return (
              <HowManyCatalogBlock
                key={row.catalogCollectionId}
                name={row.catalogName}
                members={row.items}
                quantity={qty}
                disabled={busy}
                onQty={(next) => {
                  setOverrides((prev) => {
                    const nextMap = { ...prev };
                    for (const member of row.items) nextMap[member.id] = next;
                    return nextMap;
                  });
                  if (next != null) persistQty(next);
                }}
              />
            );
          })}
          {looseLines.length > 0 ? (
          <HowManyGroupedLines
            items={looseLines}
            unitOf={(line) => line.product.unit}
            getKey={(line) => line.product.id}
            testId="how-many-loose-lines"
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
                      activeProducts.length > 1 && !lockedSet.has(product.id) ? (
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
                        sheetMixedPack={packSizesDiffer}
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
          ) : null}
          </div>

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
        collectionId={collectionId}
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
