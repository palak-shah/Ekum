import { useEffect, useMemo, useState } from 'react';
import type { ProductView } from '@ekum/domain-types';
import { orderWhoMode } from '@/features/orders/orderWho';
import { orderSheetTitle } from '@/features/orders/orderQtyUi';
import {
  QtyStepper,
  cxNoteLink,
  sameForAllChipLabel,
} from '@/features/orders/QtyStepper';
import { formatRate } from '@/lib/format';
import { useMyCompany } from '@/lib/queries';
import { canNativeShare, shareOrCopyInvite } from '@/lib/shareInvite';
import { useTradePresence } from '@/lib/tradePresence';
import { useToast } from '@/ui/Toast';
import { Button, InlineNotice, Sheet, TextArea, cx } from '@/ui/kit';
import { OrderForBuyerSheet } from './OrderForBuyerSheet';

export type HowManyLine = {
  productId: string;
  quantity: number;
  note?: string;
};

function qtyMemoryKey(sellerId: string) {
  return `ekum:qty-each:${sellerId}`;
}

function readRememberedQty(sellerId: string): number {
  if (!sellerId || typeof localStorage === 'undefined') return 20;
  try {
    const raw = localStorage.getItem(qtyMemoryKey(sellerId));
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : 20;
  } catch {
    return 20;
  }
}

function rememberQty(sellerId: string, qty: number) {
  if (!sellerId || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(qtyMemoryKey(sellerId), String(qty));
  } catch {
    // ignore
  }
}

function tagsLine(product: ProductView): string | null {
  const tags = (product.categories ?? []).map((t) => t.trim()).filter(Boolean);
  if (tags.length === 0) return null;
  return tags.slice(0, 4).join(' · ');
}

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
  orderGoesToNames,
}: {
  open: boolean;
  onClose: () => void;
  sellerId: string;
  products: ProductView[];
  submitting?: boolean;
  asking?: boolean;
  error?: string | null;
  onSendOrder: (lines: HowManyLine[]) => void;
  onAskRates: (lines: HowManyLine[]) => void;
  orderGoesToName?: string | null;
  orderGoesToNames?: string[] | null;
}) {
  const { selling, trading } = useTradePresence();
  const me = useMyCompany();
  const { showToast } = useToast();
  const whoMode = orderWhoMode({
    canLogForBuyer: selling || trading,
    actorCompanyId: me.data?.id ?? '',
    productCompanyIds: products.map((product) => product.companyId),
  });
  const canOrderForBuyer = whoMode !== 'hidden';
  const showPlaceOrderAsk = whoMode !== 'buyer-only';

  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [buyerOpen, setBuyerOpen] = useState(false);
  const [sharedQty, setSharedQty] = useState(20);
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [noteOpen, setNoteOpen] = useState<Record<string, boolean>>({});
  const [removed, setRemoved] = useState<Set<string>>(() => new Set());
  const [sameOpen, setSameOpen] = useState(false);
  const [sameDraft, setSameDraft] = useState(20);

  const productKey = products.map((product) => product.id).join(',');
  const qtyKey = sellerId || 'multi';

  useEffect(() => {
    if (!open) return;
    const remembered = readRememberedQty(qtyKey);
    setSharedQty(remembered);
    setSameDraft(remembered);
    setOverrides({});
    setNotes({});
    setNoteOpen({});
    setRemoved(new Set());
    setSameOpen(false);
    setBuyerOpen(false);
    setInviteUrl(null);
  }, [open, qtyKey, productKey]);

  const activeProducts = useMemo(
    () => products.filter((product) => !removed.has(product.id)),
    [products, removed],
  );

  const lines = useMemo(
    () =>
      activeProducts.map((product) => ({
        product,
        quantity: overrides[product.id] ?? sharedQty,
        note: notes[product.id]?.trim() || undefined,
      })),
    [activeProducts, overrides, sharedQty, notes],
  );

  const applyShared = (qty: number) => {
    if (qty <= 0) return;
    setSharedQty(qty);
    setSameDraft(qty);
    setOverrides({});
    setSameOpen(false);
  };

  const cancelSame = () => {
    setSameDraft(sharedQty);
    setSameOpen(false);
  };

  const payload = (): HowManyLine[] =>
    lines.map((line) => ({
      productId: line.product.id,
      quantity: line.quantity,
      ...(line.note ? { note: line.note } : {}),
    }));

  const busy = Boolean(submitting || asking);
  const sheetTitle = orderSheetTitle(activeProducts.length);
  const canRemove = activeProducts.length > 1;

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

  const decideFooter = (
    <div className="flex flex-col gap-2">
      {showPlaceOrderAsk ? (
        <>
          <Button
            fullWidth
            disabled={busy || activeProducts.length === 0}
            onClick={() => {
              rememberQty(qtyKey, sharedQty);
              onSendOrder(payload());
            }}
          >
            {submitting ? 'Sending…' : 'Place Order'}
          </Button>
          <Button
            variant="secondary"
            fullWidth
            disabled={busy || activeProducts.length === 0}
            onClick={() => {
              rememberQty(qtyKey, sharedQty);
              onAskRates(payload());
            }}
          >
            {asking ? 'Opening…' : 'Ask rates'}
          </Button>
        </>
      ) : null}
      {canOrderForBuyer ? (
        <Button
          variant="secondary"
          fullWidth
          disabled={busy || activeProducts.length === 0}
          onClick={() => setBuyerOpen(true)}
        >
          Order for buyer
        </Button>
      ) : null}
    </div>
  );

  return (
    <>
      <Sheet open={open} onClose={onClose} title={sheetTitle} footer={decideFooter}>
        <div className="flex flex-col gap-4 pb-1">
          {orderGoesToNames && orderGoesToNames.length > 0 ? (
            <p className="rounded-xl border border-line bg-foam px-3.5 py-2.5 text-[14px] font-medium leading-snug text-ink">
              Order goes to{' '}
              <span className="font-semibold">{orderGoesToNames.join(', ')}</span>
            </p>
          ) : orderGoesToName ? (
            <p className="rounded-xl border border-line bg-foam px-3.5 py-2.5 text-[14px] font-medium leading-snug text-ink">
              Order goes to <span className="font-semibold">{orderGoesToName}</span>
            </p>
          ) : null}

          {activeProducts.length > 1 ? (
            sameOpen ? (
              <div
                className="rounded-xl border border-line bg-foam/80 px-3 py-2.5"
                data-testid="same-for-all-editor"
              >
                <p className="text-[13px] font-semibold text-ink">Same for all</p>
                <div className="mt-2">
                  <QtyStepper
                    value={sameDraft}
                    disabled={busy}
                    aria-label="Same pieces for all designs"
                    onChange={setSameDraft}
                  />
                </div>
                <div className="mt-2.5 flex items-center gap-4">
                  <button
                    type="button"
                    disabled={busy}
                    className="text-[13px] font-bold text-accent disabled:opacity-45"
                    onClick={() => applyShared(sameDraft)}
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className="text-[13px] font-bold text-muted disabled:opacity-45"
                    onClick={cancelSame}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={busy}
                data-testid="same-for-all-chip"
                className="inline-flex w-fit items-center rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-bold tracking-tight text-ink disabled:opacity-45"
                onClick={() => {
                  setSameDraft(sharedQty);
                  setSameOpen(true);
                }}
              >
                {sameForAllChipLabel(sharedQty)}
              </button>
            )
          ) : null}

          <ul
            className="max-h-[min(24rem,55vh)] overflow-y-auto overflow-x-hidden rounded-xl border border-line bg-surface"
            data-testid="how-many-lines"
          >
            {lines.map(({ product, quantity }, index) => {
              const thumb = product.images[0] ?? null;
              const tags = tagsLine(product);
              const rate = formatRate(
                product.rate ?? null,
                product.unit ?? null,
                product.rateMax ?? null,
              );
              const openNote = Boolean(noteOpen[product.id]);
              const noteValue = notes[product.id] ?? '';
              return (
                <li
                  key={product.id}
                  className={cx(
                    'px-3 py-3',
                    index > 0 && 'border-t border-line/70',
                  )}
                  data-testid="how-many-line"
                >
                  <div className="flex items-start gap-3">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-foam text-sm font-bold text-muted">
                        {product.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-semibold tracking-tight text-ink">
                            {product.name}
                          </p>
                          {tags ? (
                            <p className="mt-0.5 truncate text-[12px] text-muted">{tags}</p>
                          ) : null}
                          {rate !== 'On request' ? (
                            <p className="mt-0.5 text-[12px] text-muted">{rate}</p>
                          ) : null}
                        </div>
                        {canRemove ? (
                          <button
                            type="button"
                            disabled={busy}
                            aria-label={`Remove ${product.name}`}
                            className="shrink-0 px-1 text-lg leading-none text-muted disabled:opacity-45"
                            onClick={() =>
                              setRemoved((prev) => new Set(prev).add(product.id))
                            }
                          >
                            ×
                          </button>
                        ) : null}
                      </div>
                      <div className="mt-2">
                        <QtyStepper
                          value={quantity}
                          disabled={busy}
                          aria-label={`Pieces for ${product.name}`}
                          onChange={(next) =>
                            setOverrides((prev) => ({ ...prev, [product.id]: next }))
                          }
                        />
                      </div>
                      {openNote ? (
                        <div className="mt-2">
                          <button
                            type="button"
                            className={cxNoteLink()}
                            onClick={() =>
                              setNoteOpen((prev) => ({ ...prev, [product.id]: false }))
                            }
                          >
                            Note ▴
                          </button>
                          <TextArea
                            className="mt-1.5 min-h-[4.5rem] text-sm"
                            placeholder="Colour, packing…"
                            value={noteValue}
                            disabled={busy}
                            onChange={(event) =>
                              setNotes((prev) => ({
                                ...prev,
                                [product.id]: event.target.value,
                              }))
                            }
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          className={cx(cxNoteLink(), 'mt-2')}
                          disabled={busy}
                          onClick={() =>
                            setNoteOpen((prev) => ({ ...prev, [product.id]: true }))
                          }
                        >
                          Add note
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {error ? <InlineNotice message={error} /> : null}
        </div>
      </Sheet>

      <OrderForBuyerSheet
        open={buyerOpen}
        onClose={() => setBuyerOpen(false)}
        lines={payload()}
        productIds={activeProducts.map((product) => product.id)}
        onInvite={(url) => {
          setBuyerOpen(false);
          setInviteUrl(url);
        }}
        onDone={() => {
          setBuyerOpen(false);
          onClose();
        }}
      />
    </>
  );
}
