import { useEffect, useMemo, useState } from 'react';
import type { ProductView } from '@ekum/domain-types';
import { Button, InlineNotice, Sheet, TextInput, cx } from '@/ui/kit';

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
}) {
  const [sharedQty, setSharedQty] = useState(20);
  const [custom, setCustom] = useState('');
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, number>>({});

  const productKey = products.map((product) => product.id).join(',');
  const qtyKey = sellerId || 'multi';

  useEffect(() => {
    if (!open) return;
    const remembered = readRememberedQty(qtyKey);
    setSharedQty(remembered);
    setCustom('');
    setAdjustOpen(false);
    setOverrides({});
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

  return (
    <Sheet open={open} onClose={onClose} title="How many each?">
      <div className="flex flex-col gap-4 pb-1">
        <p className="text-sm text-muted">
          {products.length} design{products.length === 1 ? '' : 's'} · {sharedQty} each
          {Object.keys(overrides).length > 0 ? ' (with adjustments)' : ''}
        </p>

        <div className="flex flex-wrap gap-2">
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
        </div>

        <div className="flex items-center gap-2">
          <TextInput
            type="number"
            min={1}
            placeholder="Custom"
            value={custom}
            disabled={busy}
            className="w-28"
            onChange={(event) => {
              const value = event.target.value;
              setCustom(value);
              const n = Number(value);
              if (Number.isFinite(n) && n > 0) {
                applyShared(n);
              }
            }}
          />
          <p className="text-xs font-medium text-muted">Applies to all selected</p>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => setAdjustOpen((open) => !open)}
          className="self-start text-sm font-bold tracking-tight text-accent"
        >
          {adjustOpen ? 'Hide adjustments' : 'Adjust a few'}
        </button>

        {adjustOpen ? (
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
        ) : null}

        {error ? <InlineNotice message={error} /> : null}

        <Button
          fullWidth
          disabled={busy || products.length === 0}
          onClick={() => {
            rememberQty(qtyKey, sharedQty);
            onSendOrder(payload());
          }}
        >
          {submitting ? 'Sending…' : 'Send order request'}
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
      </div>
    </Sheet>
  );
}
