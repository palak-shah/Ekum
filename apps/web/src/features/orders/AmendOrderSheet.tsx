import { useEffect, useState } from 'react';
import type { OrderItemView } from '@ekum/domain-types';
import { HowManyGroupedLines } from '@/features/orders/HowManyGroupedLines';
import {
  HowManyLineHeading,
  HowManyQtyRow,
  HowManyRemoveButton,
} from '@/features/orders/HowManyLineHeading';
import { HowManyLineNote } from '@/features/orders/HowManyLineNote';
import {
  howManyOrderFooterSummary,
  howManyOrderUnitsMixed,
  howManyPackSizesDiffer,
  lastGroupedItem,
  qtyCountNoun,
} from '@/features/orders/howManyLineMeta';
import { OrderLineStack } from '@/features/orders/OrderLineStack';
import { OrderQtyFooterSummary } from '@/features/orders/OrderQtyFooterSummary';
import { urlsForOrderItem } from '@/features/orders/orderItemImages';
import {
  parseQtyDraft,
  QtyStepper,
  SameForAllEditor,
  sameForAllChipClassName,
  sameForAllChipLabel,
  seedSameForAllQty,
} from '@/features/orders/QtyStepper';
import { TransporterField } from '@/features/orders/TransporterField';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';
import { NoteAttachField } from '@/features/voice/NoteAttachField';
import type { NoteVoiceValue } from '@/features/voice/NoteVoiceField';
import { Button, InlineNotice, Sheet } from '@/ui/kit';

export function AmendOrderSheet({
  open,
  onClose,
  title,
  items,
  qty,
  onQty,
  removed,
  onToggleRemoved,
  lineNotes,
  onLineNote,
  transporter,
  onTransporter,
  transporterDisabled,
  note,
  onNote,
  voice,
  onVoice,
  images,
  onImages,
  error,
  saving,
  onSave,
  onOpenPhoto,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  items: OrderItemView[];
  qty: Record<string, string>;
  onQty: (productId: string, next: number | null) => void;
  removed: Set<string>;
  onToggleRemoved: (productId: string) => void;
  lineNotes: Record<string, string>;
  onLineNote: (productId: string, note: string) => void;
  transporter: string;
  onTransporter: (value: string) => void;
  transporterDisabled?: boolean;
  note: string;
  onNote: (value: string) => void;
  voice: NoteVoiceValue;
  onVoice: (value: NoteVoiceValue) => void;
  images: string[];
  onImages: (urls: string[]) => void;
  error?: string | null;
  saving?: boolean;
  onSave: () => void;
  onOpenPhoto: (item: OrderItemView) => void;
}) {
  const lines = items.filter((item) => item.productId);
  const remaining = lines.filter((item) => !removed.has(item.productId!));
  const remainingCount = remaining.length;
  const showSameForAll = remainingCount > 1 && !howManyOrderUnitsMixed(remaining);
  const [sameOpen, setSameOpen] = useState(false);
  const [sameDraft, setSameDraft] = useState<number | null>(null);
  const [sharedQty, setSharedQty] = useState<number | null>(null);

  useEffect(() => {
    if (open) return;
    setSameOpen(false);
    setSameDraft(null);
    setSharedQty(null);
  }, [open]);

  useEffect(() => {
    if (showSameForAll) return;
    setSameOpen(false);
  }, [showSameForAll]);
  const lastQtyId = lastGroupedItem(
    lines.filter((item) => !removed.has(item.productId!)),
    (item) => item.unit,
  )?.productId;
  const packSizesDiffer = howManyPackSizesDiffer(remaining);
  const footerSummary = howManyOrderFooterSummary(
    remaining.map((item) => {
      const pid = item.productId!;
      return {
        quantity: parseQtyDraft(qty[pid] ?? String(item.quantity)),
        unit: item.unit,
        piecesPerPack: item.piecesPerPack,
        dispatchUnit: item.dispatchUnit,
        rate: item.rate,
      };
    }),
  );
  const canSave =
    remainingCount >= 1 &&
    remaining.every((item) => {
      const pid = item.productId!;
      const n = parseQtyDraft(qty[pid] ?? String(item.quantity));
      return n != null && n >= 1;
    });

  const applyShared = (next: number | null) => {
    if (next == null || next <= 0) return;
    remaining.forEach((item) => onQty(item.productId!, next));
    setSharedQty(next);
    setSameDraft(next);
    setSameOpen(false);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex flex-col gap-2.5" data-testid="order-amend-footer">
          {footerSummary ? <OrderQtyFooterSummary summary={footerSummary} /> : null}
          <Button
            fullWidth
            data-testid="order-amend-save"
            onClick={onSave}
            disabled={Boolean(saving) || !canSave}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pb-1">
        {showSameForAll ? (
          sameOpen ? (
            <SameForAllEditor
              disabled={Boolean(saving) || sameDraft == null || sameDraft <= 0}
              onApply={() => applyShared(sameDraft)}
              onCancel={() => {
                setSameDraft(sharedQty);
                setSameOpen(false);
              }}
            >
              <QtyStepper
                autoFocus
                value={sameDraft}
                disabled={saving}
                aria-label="Same quantity for all designs"
                onChange={setSameDraft}
              />
            </SameForAllEditor>
          ) : (
            <button
              type="button"
              disabled={saving}
              data-testid="same-for-all-chip"
              className={sameForAllChipClassName}
              onClick={() => {
                setSameDraft(
                  seedSameForAllQty(
                    remaining.map((item) =>
                      parseQtyDraft(qty[item.productId!] ?? String(item.quantity)),
                    ),
                    sharedQty,
                  ),
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
          unitOf={(item) => item.unit}
          getKey={(item) => item.id}
          testId="order-amend-lines"
          lineTestId="order-amend-line"
          renderLine={(item) => {
            const pid = item.productId!;
            const isRemoved = removed.has(pid);
            const noun = qtyCountNoun(item.unit);
            const thumb = toAbsoluteMediaUrl(urlsForOrderItem(item)[0]);
            const lastQty = lastQtyId === pid;
            return (
              <>
                <OrderLineStack
                  trailingBelow
                  muted={isRemoved}
                  photo={
                    thumb ? (
                      <button
                        type="button"
                        className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-foam"
                        aria-label={`View photo for ${item.name}`}
                        onClick={() => onOpenPhoto(item)}
                      >
                        <img src={thumb} alt="" className="h-full w-full object-cover" />
                      </button>
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-foam text-sm font-body text-muted">
                        {item.name.charAt(0)}
                      </div>
                    )
                  }
                  title={
                    <HowManyLineHeading
                      name={item.name}
                      unit={item.unit}
                      dispatchUnit={item.dispatchUnit}
                      piecesPerPack={item.piecesPerPack}
                      rate={item.rate}
                      showPackSize={packSizesDiffer}
                    />
                  }
                  nameEnd={
                    isRemoved ? (
                      <button
                        type="button"
                        className="shrink-0 px-1 text-[12px] font-body text-muted"
                        data-testid="order-amend-undo"
                        onClick={() => onToggleRemoved(pid)}
                      >
                        Undo
                      </button>
                    ) : remainingCount > 1 ? (
                      <HowManyRemoveButton
                        name={item.name}
                        testId="order-amend-remove"
                        disabled={saving}
                        onClick={() => onToggleRemoved(pid)}
                      />
                    ) : null
                  }
                  trailing={
                    isRemoved ? null : (
                      <HowManyQtyRow
                        unit={item.unit}
                        piecesPerPack={item.piecesPerPack}
                        stepper={
                          <QtyStepper
                            value={parseQtyDraft(qty[pid] ?? String(item.quantity))}
                            disabled={saving}
                            chainQty
                            enterKeyHint={lastQty ? 'done' : 'next'}
                            aria-label={`${noun} for ${item.name}`}
                            onChange={(next) => onQty(pid, next)}
                          />
                        }
                      />
                    )
                  }
                />
                {!isRemoved ? (
                  <HowManyLineNote
                    value={lineNotes[pid] ?? ''}
                    disabled={saving}
                    ariaLabel={`Note for ${item.name}`}
                    onChange={(next) => onLineNote(pid, next)}
                  />
                ) : null}
              </>
            );
          }}
        />
        {error ? <InlineNotice message={error} /> : null}
        <TransporterField
          value={transporter}
          onChange={onTransporter}
          disabled={transporterDisabled}
          testId="amend-transporter-field"
        />
        <NoteAttachField
          label="Note"
          note={note}
          onNoteChange={onNote}
          voice={voice}
          onVoiceChange={onVoice}
          images={images}
          onImagesChange={onImages}
        />
      </div>
    </Sheet>
  );
}
