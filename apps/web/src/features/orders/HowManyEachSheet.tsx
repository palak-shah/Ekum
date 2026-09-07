import { useEffect, useMemo, useState } from 'react';
import type { ProductView } from '@ekum/domain-types';
import { orderWhoMode } from '@/features/orders/orderWho';
import { orderSheetTitle, type QtyMode } from '@/features/orders/orderQtyUi';
import { useMyCompany } from '@/lib/queries';
import { canNativeShare, shareOrCopyInvite } from '@/lib/shareInvite';
import { useTradePresence } from '@/lib/tradePresence';
import { useToast } from '@/ui/Toast';
import { Button, Chip, FilterRail, InlineNotice, Sheet, TextInput, cx } from '@/ui/kit';
import { OrderForBuyerSheet } from './OrderForBuyerSheet';

export const WHOLESALE_QTY_PRESETS = [10, 15, 20, 25, 50] as const;

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
  onSendOrder: (lines: Array<{ productId: string; quantity: number }>) => void;
  onAskRates: (lines: Array<{ productId: string; quantity: number }>) => void;
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
  const [custom, setCustom] = useState('');
  const [qtyMode, setQtyMode] = useState<QtyMode>('same');
  const [overrides, setOverrides] = useState<Record<string, number>>({});

  const productKey = products.map((product) => product.id).join(',');
  const qtyKey = sellerId || 'multi';

  useEffect(() => {
    if (!open) return;
    const remembered = readRememberedQty(qtyKey);
    setSharedQty(remembered);
    setCustom(String(remembered));
    setQtyMode('same');
    setOverrides({});
    setBuyerOpen(false);
    setInviteUrl(null);
  }, [open, qtyKey, productKey]);

  const lines = useMemo(
    () =>
      products.map((product) => ({
        product,
        quantity: overrides[product.id] ?? sharedQty,
      })),
    [products, overrides, sharedQty],
  );

  const applyShared = (qty: number) => {
    if (qty <= 0) return;
    setSharedQty(qty);
    setCustom(String(qty));
    setOverrides({});
  };

  const payload = () =>
    lines.map((line) => ({
      productId: line.product.id,
      quantity: line.quantity,
    }));

  const busy = Boolean(submitting || asking);
  const sheetTitle = orderSheetTitle(products.length);

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

  return (
    <>
      <Sheet open={open} onClose={onClose} title={sheetTitle}>
        <div className="flex flex-col gap-4 pb-1">
          {orderGoesToNames && orderGoesToNames.length > 0 ? (
            <p className="rounded-xl bg-foam px-3 py-2 text-sm font-medium text-ink">
              Order goes to {orderGoesToNames.join(', ')}
            </p>
          ) : orderGoesToName ? (
            <p className="rounded-xl bg-foam px-3 py-2 text-sm font-medium text-ink">
              Order goes to {orderGoesToName}
            </p>
          ) : null}

          {products.length > 1 ? (
            <>
              <FilterRail>
                <Chip
                  active={qtyMode === 'same'}
                  onClick={() => {
                    if (busy) return;
                    setQtyMode('same');
                    setOverrides({});
                  }}
                >
                  Same for all
                </Chip>
                <Chip
                  active={qtyMode === 'perDesign'}
                  onClick={() => {
                    if (busy) return;
                    setQtyMode('perDesign');
                  }}
                >
                  Each design
                </Chip>
              </FilterRail>
              {qtyMode === 'same' ? (
                <p className="text-xs text-muted">Same pieces for every design</p>
              ) : null}
            </>
          ) : null}

          {products.length === 1 || qtyMode === 'same' ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-ink">How many pieces?</p>
              <div className="flex flex-wrap items-center gap-2">
                {WHOLESALE_QTY_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    disabled={busy}
                    onClick={() => applyShared(preset)}
                    className={cx(
                      'rounded-full px-3.5 py-2 text-sm font-bold tracking-tight',
                      sharedQty === preset && Object.keys(overrides).length === 0
                        ? 'bg-accent text-white'
                        : 'bg-foam text-slate',
                    )}
                  >
                    {preset}
                  </button>
                ))}
                <TextInput
                  type="number"
                  min={1}
                  placeholder="Custom"
                  value={custom}
                  disabled={busy}
                  className="w-20"
                  onChange={(event) => {
                    const value = event.target.value;
                    setCustom(value);
                    const n = Number(value);
                    if (Number.isFinite(n) && n > 0) {
                      applyShared(n);
                    }
                  }}
                />
              </div>
            </div>
          ) : (
            <ul className="flex max-h-56 flex-col gap-2 overflow-y-auto">
              {lines.map(({ product, quantity }) => {
                const thumb = product.images[0] ?? null;
                return (
                  <li
                    key={product.id}
                    className="flex items-center gap-3 rounded-[14px] border border-line bg-foam/40 px-2.5 py-2"
                  >
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
                      <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
                      {product.sku ? (
                        <p className="truncate text-xs text-muted">{product.sku}</p>
                      ) : null}
                    </div>
                    <TextInput
                      type="number"
                      min={1}
                      className="w-20"
                      value={String(quantity)}
                      disabled={busy}
                      onChange={(event) => {
                        const n = Number(event.target.value);
                        if (!Number.isFinite(n) || n <= 0) return;
                        setOverrides((prev) => ({ ...prev, [product.id]: n }));
                      }}
                    />
                  </li>
                );
              })}
            </ul>
          )}

          {error ? <InlineNotice message={error} /> : null}

          {showPlaceOrderAsk ? (
            <>
              <Button
                fullWidth
                disabled={busy || products.length === 0}
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
                disabled={busy || products.length === 0}
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
              disabled={busy || products.length === 0}
              onClick={() => setBuyerOpen(true)}
            >
              Order for buyer
            </Button>
          ) : null}
        </div>
      </Sheet>

      <OrderForBuyerSheet
        open={buyerOpen}
        onClose={() => setBuyerOpen(false)}
        lines={payload()}
        productIds={products.map((product) => product.id)}
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
