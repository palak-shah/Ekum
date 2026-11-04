import { useState } from 'react';
import { MEDIA_VARIANT } from '@ekum/domain-types';
import {
  CURATE_ASK_RELIST,
  cartMayAskRelist,
  curateAskAllLabel,
  curateAskKind,
  curateBlockReason,
  mayAskToPutInPack,
  skippedDesignsLabel,
  unavailableDesignsSummary,
  zeroEligibleSharedReason,
} from '@/features/browse/curateCheck';
import { CurateWhyHint } from '@/features/browse/CurateWhyHint';
import { ManagedImage } from '@/ui/ManagedImage';
import { Button, cx } from '@/ui/kit';

export type RepostSkipRow = {
  productId: string;
  name: string;
  thumbUrl: string | null;
  companyId: string;
  companyName: string;
  sourceCollectionId?: string;
  code?: string;
};

function isHttpUrl(value: string | null | undefined): value is string {
  return Boolean(value && /^https?:\/\//i.test(value));
}

function DesignRow({
  row,
  muted,
  reason,
  askLabel,
  onAsk,
}: {
  row: RepostSkipRow;
  muted?: boolean;
  reason?: string;
  askLabel?: string;
  onAsk?: () => void;
}) {
  return (
    <li
      className={cx(
        'flex items-center gap-2.5 rounded-xl border px-2.5 py-2',
        muted ? 'border-line bg-foam/60' : 'border-line bg-surface',
      )}
      data-testid={muted ? 'curate-blocked-row' : 'repost-eligible-row'}
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-foam">
        {row.thumbUrl && isHttpUrl(row.thumbUrl) ? (
          <ManagedImage
            src={row.thumbUrl}
            alt=""
            variant={MEDIA_VARIANT.Thumbnail1}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-sm font-body text-muted">
            {row.name.slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-emphasis text-ink">{row.name}</p>
        <p className="truncate text-[12px] text-muted">{row.companyName}</p>
        {reason ? <p className="mt-0.5 text-[12px] font-body text-muted">{reason}</p> : null}
      </div>
      {askLabel && onAsk ? (
        <button
          type="button"
          className="shrink-0 text-meta font-emphasis text-accent disabled:opacity-50"
          data-testid="curate-blocked-ask"
          onClick={onAsk}
        >
          {askLabel}
        </button>
      ) : null}
    </li>
  );
}

export function RepostSkipSection({
  allowed,
  blocked,
  extraHint,
  allowRelistAsk,
  trading,
  myCompanyId,
  pendingByProductId,
  askingKey,
  onAsk,
  onAskAll,
}: {
  allowed: RepostSkipRow[];
  blocked: Array<RepostSkipRow & { code: string }>;
  extraHint?: string | null;
  allowRelistAsk: boolean;
  trading: boolean;
  myCompanyId?: string;
  pendingByProductId: Record<string, boolean>;
  askingKey: string | null;
  onAsk: (row: RepostSkipRow & { code: string }) => void;
  onAskAll: (rows: Array<RepostSkipRow & { code: string }>) => void;
}) {
  const [open, setOpen] = useState(false);
  const codes = blocked.map((row) => row.code);
  const zeroEligible = allowed.length < 1 && blocked.length > 0;
  const canAsk = allowRelistAsk && cartMayAskRelist(codes);
  const relistAskable = blocked.filter((row) =>
    mayAskToPutInPack({
      trading,
      ownCompany: Boolean(myCompanyId) && row.companyId === myCompanyId,
      waiting: Boolean(pendingByProductId[row.productId]),
      packLocked: canAsk && curateAskKind(row.code) === 'relist',
      lookOnly: row.code === 'FOLLOW_LOOK_ONLY',
    }),
  );
  const sharedReason = zeroEligibleSharedReason(codes);
  const uniqueReasons = new Set(blocked.map((row) => curateBlockReason(row.code)));
  const showPerRowReason = uniqueReasons.size > 1;

  if (allowed.length < 1 && blocked.length < 1) return null;

  return (
    <div className="flex flex-col gap-2">
      {allowed.length > 0 ? (
        <ul className="flex max-h-44 flex-col gap-2 overflow-y-auto" data-testid="repost-eligible-list">
          {allowed.map((row) => (
            <DesignRow key={row.productId} row={row} />
          ))}
        </ul>
      ) : null}

      {zeroEligible ? (
        <div className="flex flex-col gap-1" data-testid="repost-unavailable-summary">
          <p className="text-sm text-muted">{unavailableDesignsSummary(blocked.length)}</p>
          <p className="text-sm text-muted">{sharedReason}</p>
        </div>
      ) : null}

      {blocked.length > 0 ? (
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-xl border border-line bg-foam/60 px-3 py-2.5 text-left"
          data-testid="repost-skipped-toggle"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="text-sm font-emphasis text-ink">
            {zeroEligible ? 'Show designs' : skippedDesignsLabel(blocked.length)}
          </span>
          <span className="text-xs text-muted">{open ? 'Hide' : 'Show'}</span>
        </button>
      ) : null}

      {blocked.length > 0 && open ? (
        <ul className="flex max-h-44 flex-col gap-2 overflow-y-auto" data-testid="curate-blocked-list">
          {blocked.map((row) => {
            const waiting = Boolean(pendingByProductId[row.productId]);
            const showAsk = relistAskable.some((item) => item.productId === row.productId);
            return (
              <DesignRow
                key={row.productId}
                row={row}
                muted
                reason={
                  waiting
                    ? 'Waiting for Allow'
                    : showPerRowReason
                      ? curateBlockReason(row.code)
                      : undefined
                }
                askLabel={
                  showAsk
                    ? askingKey === row.productId
                      ? 'Asking…'
                      : CURATE_ASK_RELIST
                    : undefined
                }
                onAsk={
                  showAsk
                    ? () => {
                        onAsk(row);
                      }
                    : undefined
                }
              />
            );
          })}
        </ul>
      ) : null}

      {blocked.length > 0 && !zeroEligible ? (
        <div className="flex flex-col gap-1">
          {!showPerRowReason && sharedReason ? (
            <p className="text-sm font-body text-muted" data-testid="repost-skip-reason">
              {sharedReason}
            </p>
          ) : null}
          <div className="flex items-center gap-1">
            <CurateWhyHint codes={codes} extra={extraHint} testId="curate-skip-info" />
          </div>
        </div>
      ) : null}

      {relistAskable.length > 1 ? (
        <Button
          variant="secondary"
          fullWidth
          disabled={askingKey != null}
          data-testid="curate-ask-all-relist"
          onClick={() => onAskAll(relistAskable)}
        >
          {askingKey === 'all-relist' ? 'Asking…' : curateAskAllLabel(relistAskable.length)}
        </Button>
      ) : null}
    </div>
  );
}
