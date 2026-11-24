import { RepostPricingMode } from '@ekum/domain-types';
import { Field, InlineNotice, TextInput, cx } from '@/ui/kit';
import {
  sheetStepperBtnClass,
  sheetStepperQtyInputClass,
  sheetStepperTrackClass,
} from '@/ui/designLineChrome';
import {
  isPrototypeMarginMode,
  packPricingModeLabel,
  prototypeMarginChoice,
  withExclusiveRepostPricingMode,
  type RepostPricingFormState,
} from '@/features/catalog/repostPricingForm';

const MODE_OPTIONS = [
  [RepostPricingMode.Same, 'Same as source'],
  [RepostPricingMode.MarginFixed, 'Add ₹ margin'],
  [RepostPricingMode.MarginPercent, 'Add % margin'],
  [RepostPricingMode.Edit, 'Edit quote'],
] as const;

export type RepostEditDesignRow = {
  productId: string;
  name: string;
  thumbUrl?: string | null;
  /** Disclosed immediate supplier rate — omit when restricted / unavailable. */
  supplierRate: number | null;
  supplierRateLabel?: string | null;
};

const choiceClass = (selected: boolean) =>
  selected
    ? 'rounded-xl border border-accent bg-accent/5 px-3 py-2.5 text-left text-sm font-emphasis text-ink'
    : 'rounded-xl border border-line px-3 py-2.5 text-left text-sm text-muted';

const segClass = (selected: boolean) =>
  selected
    ? 'flex-1 rounded-lg border border-accent bg-accent/5 px-2 py-2 text-center text-sm font-emphasis text-ink'
    : 'flex-1 rounded-lg border border-line px-2 py-2 text-center text-sm text-muted';

/**
 * Pack / design buyer-facing calc controls (Batch 3 language).
 * Show rates (`rateVisibility`) stays outside this block.
 * `variant="prototype"` = Explore RepostSheet compact Same / Edit / ± Margin.
 */
export function RepostPricingFields({
  value,
  onChange,
  allowInherit = false,
  packModeHint = null,
  editInvalidated = false,
  testIdPrefix = 'repost-pricing',
  variant = 'default',
  /** @deprecated Pack Edit is collection-only; ignored on prototype. */
  editDesigns: _editDesigns = [],
  /** @deprecated Pack Edit is collection-only; ignored on prototype. */
  editRatesByProductId: _editRatesByProductId = {},
  /** @deprecated Pack Edit is collection-only; ignored on prototype. */
  onEditRateChange: _onEditRateChange,
  supplierCue = null,
}: {
  value: RepostPricingFormState;
  onChange: (next: RepostPricingFormState) => void;
  /** Design override: “Use pack rate” clears mode. */
  allowInherit?: boolean;
  /** When overriding, quiet line naming the pack default. */
  packModeHint?: string | null;
  editInvalidated?: boolean;
  testIdPrefix?: string;
  variant?: 'default' | 'prototype';
  /**
   * @deprecated Explore Edit is pack/catalog only — props kept for call-site
   * compatibility; prototype ignores them.
   */
  editDesigns?: RepostEditDesignRow[];
  editRatesByProductId?: Record<string, string>;
  onEditRateChange?: (productId: string, rate: string) => void;
  /** Quiet “Supplier ₹…” when disclosed. */
  supplierCue?: string | null;
}) {
  void _editDesigns;
  void _editRatesByProductId;
  void _onEditRateChange;
  if (variant === 'prototype') {
    const marginOn = isPrototypeMarginMode(value.mode);
    const marginKind = prototypeMarginChoice(value.mode);
    const editOn = value.mode === RepostPricingMode.Edit;
    const sameOn = value.mode === RepostPricingMode.Same || value.mode == null;

    return (
      <div data-testid={testIdPrefix} className="flex flex-col gap-3">
        <div>
          <p className="mb-1 text-sm font-emphasis text-ink">Your rate</p>
          {supplierCue ? (
            <p className="mb-2 text-xs text-muted" data-testid={`${testIdPrefix}-supplier-cue`}>
              {supplierCue}
            </p>
          ) : (
            <p className="mb-2 text-xs text-muted">How buyers see your price.</p>
          )}
          {editInvalidated ? (
            <div className="mb-2">
              <InlineNotice
                message="Source rate changed — enter your Edit rate again (or pick another mode)."
                tone="muted"
              />
            </div>
          ) : null}
          <div className="grid grid-cols-3 gap-1.5" data-testid={`${testIdPrefix}-choices`}>
            <button
              type="button"
              data-testid={`${testIdPrefix}-same`}
              className={segClass(sameOn)}
              onClick={() =>
                onChange(withExclusiveRepostPricingMode(value, RepostPricingMode.Same))
              }
            >
              Same
            </button>
            <button
              type="button"
              data-testid={`${testIdPrefix}-edit`}
              className={segClass(editOn)}
              onClick={() =>
                onChange(withExclusiveRepostPricingMode(value, RepostPricingMode.Edit))
              }
            >
              Edit rate
            </button>
            <button
              type="button"
              data-testid={`${testIdPrefix}-margin`}
              className={segClass(marginOn)}
              onClick={() =>
                onChange(
                  withExclusiveRepostPricingMode(
                    value,
                    value.mode === RepostPricingMode.MarginPercent
                      ? RepostPricingMode.MarginPercent
                      : RepostPricingMode.MarginFixed,
                  ),
                )
              }
            >
              ± Margin
            </button>
          </div>
        </div>

        {marginOn ? (
          <div className="flex flex-col gap-1" data-testid={`${testIdPrefix}-margin-block`}>
            {/* One tight row: ₹|% + − n + (dispatch sheet stepper chrome). */}
            <div className="flex items-center gap-2">
              <div
                className="flex h-10 shrink-0 overflow-hidden rounded-lg border border-line"
                role="group"
                aria-label="Margin unit"
              >
                <button
                  type="button"
                  data-testid={`${testIdPrefix}-margin-fixed`}
                  className={cx(
                    'h-full min-w-10 px-2.5 text-sm',
                    marginKind === 'fixed'
                      ? 'bg-accent/5 font-emphasis text-ink'
                      : 'bg-surface text-muted',
                  )}
                  onClick={() =>
                    onChange({
                      ...value,
                      mode: RepostPricingMode.MarginFixed,
                    })
                  }
                >
                  ₹
                </button>
                <button
                  type="button"
                  data-testid={`${testIdPrefix}-margin-percent`}
                  className={cx(
                    'h-full min-w-10 border-l border-line px-2.5 text-sm',
                    marginKind === 'percent'
                      ? 'bg-accent/5 font-emphasis text-ink'
                      : 'bg-surface text-muted',
                  )}
                  onClick={() =>
                    onChange({
                      ...value,
                      mode: RepostPricingMode.MarginPercent,
                    })
                  }
                >
                  %
                </button>
              </div>
              <div className={cx(sheetStepperTrackClass, 'min-w-0 flex-1')}>
                <button
                  type="button"
                  className={sheetStepperBtnClass}
                  data-testid={`${testIdPrefix}-margin-minus`}
                  aria-label="Decrease margin"
                  onClick={() => {
                    const n = Number(value.marginValue);
                    const base = Number.isFinite(n) ? n : 0;
                    onChange({ ...value, marginValue: String(base - 1) });
                  }}
                >
                  −
                </button>
                <input
                  inputMode="decimal"
                  value={value.marginValue}
                  onChange={(e) => onChange({ ...value, marginValue: e.target.value })}
                  placeholder="0"
                  data-testid={`${testIdPrefix}-margin-value`}
                  className={sheetStepperQtyInputClass}
                  aria-label={marginKind === 'fixed' ? 'Margin rupees' : 'Margin percent'}
                />
                <button
                  type="button"
                  className={sheetStepperBtnClass}
                  data-testid={`${testIdPrefix}-margin-plus`}
                  aria-label="Increase margin"
                  onClick={() => {
                    const n = Number(value.marginValue);
                    const base = Number.isFinite(n) ? n : 0;
                    onChange({ ...value, marginValue: String(base + 1) });
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {editOn ? (
          <div className="flex flex-col gap-2" data-testid={`${testIdPrefix}-edit-pack`}>
            <Field label="Your rate ₹">
              <TextInput
                inputMode="decimal"
                value={value.editedRate}
                onChange={(e) => onChange({ ...value, editedRate: e.target.value })}
                placeholder="e.g. 150"
                data-testid={`${testIdPrefix}-edited-rate`}
              />
            </Field>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div data-testid={testIdPrefix}>
      <p className="mb-2 text-sm font-emphasis text-ink">Your rate</p>
      <p className="mb-2 text-xs text-muted">
        How buyers see your price. Show rates stays separate
        {allowInherit ? ' · leave as pack rate to inherit' : ''}.
      </p>
      {packModeHint ? (
        <p className="mb-2 text-xs text-muted" data-testid={`${testIdPrefix}-pack-hint`}>
          Pack default: {packPricingModeLabel(packModeHint)}
        </p>
      ) : null}
      {editInvalidated ? (
        <div className="mb-2">
          <InlineNotice
            message="Source rate changed — enter your Edit quote again (or pick another mode)."
            tone="muted"
          />
        </div>
      ) : null}
      <div className="flex flex-col gap-1.5">
        {allowInherit ? (
          <button
            type="button"
            data-testid={`${testIdPrefix}-inherit`}
            onClick={() => onChange({ mode: null, marginValue: '', editedRate: '' })}
            className={choiceClass(value.mode == null)}
          >
            Use pack rate
          </button>
        ) : null}
        {MODE_OPTIONS.map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            data-testid={`${testIdPrefix}-${mode}`}
            onClick={() =>
              onChange({
                mode,
                marginValue: value.marginValue,
                editedRate: value.editedRate,
              })
            }
            className={choiceClass(value.mode === mode)}
          >
            {label}
            {allowInherit && value.mode === mode ? (
              <span className="mt-0.5 block text-xs font-normal text-muted">
                Overrides pack
              </span>
            ) : null}
          </button>
        ))}
      </div>
      {value.mode === RepostPricingMode.MarginFixed ||
      value.mode === RepostPricingMode.MarginPercent ? (
        <Field
          label={value.mode === RepostPricingMode.MarginFixed ? 'Margin ₹' : 'Margin %'}
          className="mt-3"
        >
          <TextInput
            inputMode="decimal"
            value={value.marginValue}
            onChange={(e) => onChange({ ...value, marginValue: e.target.value })}
            placeholder="0"
            data-testid={`${testIdPrefix}-margin-value`}
          />
        </Field>
      ) : null}
      {value.mode === RepostPricingMode.Edit ? (
        <Field label="Your quote ₹" className="mt-3">
          <TextInput
            inputMode="decimal"
            value={value.editedRate}
            onChange={(e) => onChange({ ...value, editedRate: e.target.value })}
            placeholder="e.g. 150"
            data-testid={`${testIdPrefix}-edited-rate`}
          />
        </Field>
      ) : null}
    </div>
  );
}
