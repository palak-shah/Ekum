import type { BroadcastListView, ConnectionView } from '@ekum/domain-types';
import { PublishAudience, RateVisibility } from '@ekum/domain-types';
import { ConnectionPicker } from '@/ui/ConnectionPicker';
import { Field, TextInput, cx } from '@/ui/kit';
import {
  mergeGroupsPublishPolicy,
  readCompanyPublishDefaults,
  unionGroupMembers,
  type PublishSheetPolicy,
} from './publishDefaults';

export type PublishAudienceState = {
  audience: string;
  selectedGroupIds: string[];
  pickCompanies: boolean;
  audienceCompanies: Set<string>;
  rateVisibility: string;
  allowForward: boolean;
  policyHint: string | null;
};

export function emptyPublishAudienceState(
  usual?: PublishSheetPolicy,
): PublishAudienceState {
  return {
    audience: PublishAudience.Connections,
    selectedGroupIds: [],
    pickCompanies: false,
    audienceCompanies: new Set(),
    rateVisibility: usual?.rateVisibility ?? RateVisibility.OnRequest,
    allowForward: usual?.allowForward !== false,
    policyHint: null,
  };
}

/** Restore sheet from a published collection/product view. */
export function restorePublishAudienceState(input: {
  audience: string;
  audienceCompanyIds: string[];
  audienceGroupIds?: string[];
  rateVisibility: string;
  allowForward: boolean;
}): PublishAudienceState {
  const groupIds = input.audienceGroupIds ?? [];
  return {
    audience: input.audience || PublishAudience.Connections,
    selectedGroupIds: groupIds,
    pickCompanies:
      input.audience === PublishAudience.Selected && groupIds.length === 0,
    audienceCompanies: new Set(input.audienceCompanyIds ?? []),
    rateVisibility: input.rateVisibility || RateVisibility.OnRequest,
    allowForward: input.allowForward !== false,
    policyHint: null,
  };
}

function applyGroupsToState(
  prev: PublishAudienceState,
  groupIds: string[],
  lists: BroadcastListView[],
  tradeDefaults: Record<string, unknown> | null | undefined,
): PublishAudienceState {
  const selected = lists.filter((list) => groupIds.includes(list.id));
  const usual = readCompanyPublishDefaults(tradeDefaults);
  const { policy, usedStrictestMerge } = mergeGroupsPublishPolicy(usual, selected);
  return {
    ...prev,
    audience: PublishAudience.Selected,
    selectedGroupIds: groupIds,
    pickCompanies: false,
    audienceCompanies: new Set(unionGroupMembers(selected)),
    rateVisibility: policy.rateVisibility,
    allowForward: policy.allowForward,
    policyHint: usedStrictestMerge
      ? 'Using safest settings from selected groups.'
      : selected.length === 1
        ? null
        : null,
  };
}

type Props = {
  state: PublishAudienceState;
  onChange: (next: PublishAudienceState) => void;
  lists: BroadcastListView[];
  listsLoading?: boolean;
  connections: ConnectionView[];
  connectionsLoading?: boolean;
  tradeDefaults: Record<string, unknown> | null | undefined;
  /** Schedule block (collections only). */
  schedule?: {
    startsAt: string;
    endsAt: string;
    evergreen: boolean;
    onStartsAt: (value: string) => void;
    onEndsAt: (value: string) => void;
    onEvergreen: (value: boolean) => void;
  };
  showConsent?: boolean;
  consent?: boolean;
  onConsent?: (value: boolean) => void;
  consentLabel?: string;
  onCreateGroup?: () => void;
  /** When true, Who is already chosen (published restore) — still show all sections. */
  isVisibilityUpdate?: boolean;
};

export function PublishAudienceFields({
  state,
  onChange,
  lists,
  connections,
  connectionsLoading,
  tradeDefaults,
  schedule,
  showConsent,
  consent,
  onConsent,
  consentLabel = 'Start selling — publish?',
  onCreateGroup,
  isVisibilityUpdate = false,
}: Props) {
  const whoReady = Boolean(state.audience);
  const showSelectedExtras = state.audience === PublishAudience.Selected;
  const showRules = whoReady;
  const showWhen = whoReady;

  const toggleGroup = (list: BroadcastListView) => {
    const has = state.selectedGroupIds.includes(list.id);
    const nextIds = has
      ? state.selectedGroupIds.filter((id) => id !== list.id)
      : [...state.selectedGroupIds, list.id];
    if (nextIds.length === 0) {
      onChange({
        ...state,
        selectedGroupIds: [],
        audienceCompanies: new Set(),
        pickCompanies: false,
        policyHint: null,
        ...readCompanyPublishDefaults(tradeDefaults),
      });
      return;
    }
    onChange(applyGroupsToState(state, nextIds, lists, tradeDefaults));
  };

  const selectAudience = (value: string) => {
    if (value === PublishAudience.Selected) {
      onChange({
        ...state,
        audience: value,
        pickCompanies: state.selectedGroupIds.length === 0,
      });
      return;
    }
    const usual = readCompanyPublishDefaults(tradeDefaults);
    onChange({
      ...state,
      audience: value,
      selectedGroupIds: [],
      pickCompanies: false,
      audienceCompanies: new Set(),
      rateVisibility: usual.rateVisibility,
      allowForward: usual.allowForward,
      policyHint: null,
    });
  };

  const openPickCompanies = () => {
    const usual = readCompanyPublishDefaults(tradeDefaults);
    onChange({
      ...state,
      audience: PublishAudience.Selected,
      selectedGroupIds: [],
      pickCompanies: true,
      audienceCompanies: new Set(state.audienceCompanies),
      rateVisibility: usual.rateVisibility,
      allowForward: usual.allowForward,
      policyHint: null,
    });
  };

  const onCompaniesChange = (ids: string[]) => {
    onChange({
      ...state,
      audience: PublishAudience.Selected,
      selectedGroupIds: [],
      pickCompanies: true,
      audienceCompanies: new Set(ids),
      policyHint: null,
    });
  };

  const memberCount = state.audienceCompanies.size;
  const selectedLists = lists.filter((list) => state.selectedGroupIds.includes(list.id));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-semibold text-ink">Who can see this?</p>
        {isVisibilityUpdate ? (
          <p className="mb-2 text-xs text-muted">Add groups or companies anytime.</p>
        ) : null}
        <div className="flex flex-col gap-1.5">
          {            (
            [
              [PublishAudience.Everyone, 'Everyone'],
              [PublishAudience.Connections, 'My connections'],
              [PublishAudience.Followers, 'My followers'],
              [PublishAudience.Selected, 'Selected'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => selectAudience(value)}
              className={cx(
                'rounded-xl border px-3 py-2.5 text-left text-sm',
                state.audience === value
                  ? 'border-accent bg-accent/5 font-medium text-ink'
                  : 'border-line text-muted',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {showSelectedExtras ? (
          <div className="mt-3 flex flex-col gap-3">
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-ink">Buyer groups</p>
                {onCreateGroup ? (
                  <button
                    type="button"
                    className="text-xs font-medium text-accent"
                    onClick={onCreateGroup}
                  >
                    {lists.length > 0 ? 'Add group' : 'Create group'}
                  </button>
                ) : null}
              </div>
              {lists.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {lists.map((list) => {
                    const selected = state.selectedGroupIds.includes(list.id);
                    return (
                      <button
                        key={list.id}
                        type="button"
                        onClick={() => toggleGroup(list)}
                        className={cx(
                          'rounded-full border px-3 py-1 text-xs font-medium',
                          selected
                            ? 'border-accent bg-accent/5 text-ink'
                            : 'border-line text-ink',
                        )}
                      >
                        {list.name}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted">Reuse the same buyers next time</p>
              )}
            </div>

            {!state.pickCompanies && state.selectedGroupIds.length > 0 ? (
              <div className="flex flex-col gap-1">
                <p className="text-xs text-muted">
                  {memberCount} business{memberCount === 1 ? '' : 'es'} will see it
                  {selectedLists.length > 1 ? ` · ${selectedLists.length} groups` : ''}
                </p>
                <button
                  type="button"
                  className="self-start text-xs font-medium text-accent"
                  onClick={openPickCompanies}
                >
                  Pick companies instead
                </button>
              </div>
            ) : null}

            {state.pickCompanies || state.selectedGroupIds.length === 0 ? (
              <div className="flex flex-col gap-2">
                {state.selectedGroupIds.length === 0 ? (
                  <p className="text-xs text-muted">
                    {memberCount} selected · only these businesses will see it
                  </p>
                ) : (
                  <p className="text-xs text-muted">Custom list — groups cleared</p>
                )}
                <ConnectionPicker
                  mode="multi"
                  embedded
                  label=""
                  loading={connectionsLoading}
                  connections={connections}
                  value={[...state.audienceCompanies]}
                  onChange={onCompaniesChange}
                  emptyMessage="Approve a connection first, then pick them here."
                />
                {lists.length > 0 && state.pickCompanies ? (
                  <button
                    type="button"
                    className="self-start text-xs font-medium text-accent"
                    onClick={() =>
                      onChange({
                        ...state,
                        pickCompanies: false,
                        audienceCompanies: new Set(),
                      })
                    }
                  >
                    Back to groups
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {showRules ? (
        <div className="flex flex-col gap-3">
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Show rates?</p>
            <div className="flex flex-col gap-1.5">
              {(
                [
                  [RateVisibility.OnRequest, 'On request'],
                  [RateVisibility.Visible, 'Visible'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onChange({ ...state, rateVisibility: value, policyHint: null })}
                  className={cx(
                    'rounded-xl border px-3 py-2.5 text-left text-sm',
                    state.rateVisibility === value
                      ? 'border-accent bg-accent/5 font-medium text-ink'
                      : 'border-line text-muted',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-start gap-2 rounded-xl border border-line px-3 py-3 text-sm text-ink">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={state.allowForward}
              onChange={(event) =>
                onChange({
                  ...state,
                  allowForward: event.target.checked,
                  policyHint: null,
                })
              }
            />
            <span>Buyers can forward</span>
          </label>
          {state.policyHint ? (
            <p className="text-xs text-muted">{state.policyHint}</p>
          ) : null}
        </div>
      ) : null}

      {showWhen && schedule ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-ink">When</p>
          <Field label="Starts (optional)">
            <TextInput
              type="date"
              value={schedule.startsAt}
              onChange={(e) => schedule.onStartsAt(e.target.value)}
            />
          </Field>
          <p className="text-xs text-muted">Empty means go live now.</p>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={schedule.evergreen}
              onChange={(e) => schedule.onEvergreen(e.target.checked)}
            />
            Evergreen — no end date
          </label>
          {!schedule.evergreen ? (
            <Field label="Ends on">
              <TextInput
                type="date"
                value={schedule.endsAt}
                onChange={(e) => schedule.onEndsAt(e.target.value)}
              />
            </Field>
          ) : null}
        </div>
      ) : null}

      {showWhen && showConsent ? (
        <label className="flex items-start gap-2 rounded-xl border border-line px-3 py-3 text-sm text-ink">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={Boolean(consent)}
            onChange={(event) => onConsent?.(event.target.checked)}
          />
          <span>{consentLabel}</span>
        </label>
      ) : null}
    </div>
  );
}

/** Build publish DTO audience fields from sheet state. */
export function publishAudienceDtoFields(state: PublishAudienceState): {
  companyIds?: string[];
  groupIds?: string[];
  groupId?: string;
} {
  if (state.audience !== PublishAudience.Selected) {
    return {};
  }
  const companyIds = [...state.audienceCompanies];
  const groupIds = state.pickCompanies ? [] : state.selectedGroupIds;
  return {
    companyIds,
    ...(groupIds.length > 0 ? { groupIds } : {}),
    ...(groupIds.length === 1 ? { groupId: groupIds[0] } : {}),
  };
}

export function publishAudienceCanSubmit(state: PublishAudienceState): boolean {
  if (state.audience !== PublishAudience.Selected) return true;
  return state.audienceCompanies.size > 0;
}

/** Apply a newly created group as selected (adds to multi-select). */
export function selectCreatedGroup(
  state: PublishAudienceState,
  list: BroadcastListView,
  lists: BroadcastListView[],
  tradeDefaults: Record<string, unknown> | null | undefined,
): PublishAudienceState {
  const nextIds = state.selectedGroupIds.includes(list.id)
    ? state.selectedGroupIds
    : [...state.selectedGroupIds, list.id];
  const withList = lists.some((l) => l.id === list.id) ? lists : [...lists, list];
  return applyGroupsToState(state, nextIds, withList, tradeDefaults);
}
