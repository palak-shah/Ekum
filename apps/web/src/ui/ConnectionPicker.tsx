import { useMemo, useState } from 'react';
import type { ConnectionView } from '@ekum/domain-types';
import { FindOnEkumBlock } from '@/features/access/FindOnEkumBlock';
import { EXPLORE_BUSINESSES_SEARCH_HREF } from '@/features/explore/exploreDiscoveryHref';
import { FindInExploreLink } from '@/ui/FindInExploreLink';
import { uniqueConnectionsByCompany } from '@/ui/uniqueConnections';
import { ChevronRightIcon } from '@/ui/icons';
import { Avatar, Button, Sheet, TextInput, cx } from '@/ui/kit';

type SingleProps = {
  mode: 'single';
  value: string | null;
  onChange: (companyId: string | null) => void;
  chooseLabel?: string;
};

type MultiProps = {
  mode: 'multi';
  value: string[];
  onChange: (companyIds: string[]) => void;
  chooseLabel?: string;
};

type CommonProps = {
  connections: ConnectionView[];
  label?: string;
  emptyMessage?: string;
  loading?: boolean;
  /** Search + list inline (e.g. inside another Sheet). */
  embedded?: boolean;
  /** When empty, link to business discovery on Explore. */
  exploreHref?: string;
  /** Name / mobile / GST lookup. `true` = field (default). `link` = Chats ＋. */
  findOnEkum?: boolean | 'link';
  /** Message an unconnected hit (Chats). */
  onMessageFound?: (companyId: string) => void;
  /** Find on Ekum finished with zero hits. */
  onFindMissChange?: (miss: boolean) => void;
};

export type ConnectionPickerProps = CommonProps & (SingleProps | MultiProps);

function matchesSearch(connection: ConnectionView, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const { name, city } = connection.company;
  return name.toLowerCase().includes(q) || city.toLowerCase().includes(q);
}

export function ConnectionPicker(props: ConnectionPickerProps) {
  const {
    connections: connectionRows,
    label = 'Connections',
    emptyMessage = 'Connect with a business first.',
    loading = false,
    embedded = false,
    exploreHref = EXPLORE_BUSINESSES_SEARCH_HREF,
    findOnEkum = true,
    onMessageFound,
    onFindMissChange,
  } = props;
  const findMode = findOnEkum === 'link' ? 'link' : findOnEkum === false ? 'off' : 'field';
  const connections = useMemo(
    () => uniqueConnectionsByCompany(connectionRows),
    [connectionRows],
  );

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const showBusinessSearch = connections.length > 0 || findMode === 'link';
  const showFindLink =
    findMode === 'link' && (query.trim().length >= 2 || connections.length === 0);

  const selectedIds = useMemo(() => {
    if (props.mode === 'single') {
      return props.value ? new Set([props.value]) : new Set<string>();
    }
    return new Set(props.value);
  }, [props]);

  const selectedConnections = connections.filter((c) => selectedIds.has(c.company.id));
  const filtered = connections.filter((c) => matchesSearch(c, query.trim()));

  const toggle = (companyId: string) => {
    if (props.mode === 'single') {
      props.onChange(companyId);
      setOpen(false);
      setQuery('');
      return;
    }
    const next = new Set(props.value);
    if (next.has(companyId)) next.delete(companyId);
    else next.add(companyId);
    props.onChange([...next]);
  };

  const list = (
    <div className="flex flex-col gap-2">
      {showBusinessSearch ? (
        <TextInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or city…"
          autoFocus={!embedded}
        />
      ) : null}
      {loading ? (
        <p className="py-4 text-center text-sm text-muted">Loading…</p>
      ) : connections.length === 0 ? (
        <p className="text-sm text-muted">{emptyMessage}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted">No matches.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {filtered.map((connection) => {
            const selected = selectedIds.has(connection.company.id);
            return (
              <button
                key={connection.company.id}
                type="button"
                onClick={() => toggle(connection.company.id)}
                className={cx(
                  'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left',
                  selected ? 'border-accent bg-accent/5' : 'border-line bg-surface',
                )}
              >
                <Avatar
                  name={connection.company.name}
                  imageUrl={connection.company.logoUrl}
                  size={36}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{connection.company.name}</p>
                  <p className="truncate text-xs text-muted">{connection.company.city}</p>
                </div>
                <span className="shrink-0 text-xs text-muted">
                  {props.mode === 'single'
                    ? selected
                      ? 'Selected'
                      : 'Select'
                    : selected
                      ? 'Selected'
                      : 'Add'}
                </span>
              </button>
            );
          })}
        </div>
      )}
      {findMode === 'field' ? (
        <FindOnEkumBlock
          onSelectConnected={(companyId) => toggle(companyId)}
          onMessage={onMessageFound}
          onMissChange={onFindMissChange}
          connectedLabel={props.mode === 'multi' ? 'Add' : 'Select'}
        />
      ) : null}
      {showFindLink ? (
        <FindOnEkumBlock
          variant="link"
          inviteAlways
          externalQuery={query.trim()}
          excludeCompanyIds={connections.map((row) => row.company.id)}
          onSelectConnected={(companyId) => toggle(companyId)}
          onMessage={onMessageFound}
          onMissChange={onFindMissChange}
          connectedLabel={props.mode === 'multi' ? 'Add' : 'Select'}
        />
      ) : null}
      {connections.length === 0 ? (
        <FindInExploreLink href={exploreHref} variant="secondary" />
      ) : null}
      {props.mode === 'multi' && !embedded && selectedIds.size > 0 ? (
        <Button fullWidth variant="secondary" onClick={() => setOpen(false)}>
          Done · {selectedIds.size} selected
        </Button>
      ) : null}
    </div>
  );

  if (embedded) {
    return (
      <div className="flex flex-col gap-2">
        {label ? <p className="text-sm font-medium text-ink">{label}</p> : null}
        {list}
      </div>
    );
  }

  const chooseLabel =
    props.chooseLabel ?? (props.mode === 'single' ? 'Choose supplier' : 'Choose recipients');

  return (
    <div className="flex flex-col gap-2">
      {label ? <p className="text-sm font-medium text-ink">{label}</p> : null}

      {selectedConnections.length > 0 ? (
        props.mode === 'single' ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-3 text-left hover:bg-foam"
          >
            <Avatar
              name={selectedConnections[0].company.name}
              imageUrl={selectedConnections[0].company.logoUrl}
              size={40}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">
                {selectedConnections[0].company.name}
              </p>
              <p className="truncate text-xs text-muted">{selectedConnections[0].company.city}</p>
            </div>
            <ChevronRightIcon className="shrink-0 text-muted" width={20} height={20} />
          </button>
        ) : (
          <div className="flex flex-col gap-1.5">
            {selectedConnections.slice(0, 3).map((connection) => (
              <div
                key={connection.company.id}
                className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-3"
              >
                <Avatar
                  name={connection.company.name}
                  imageUrl={connection.company.logoUrl}
                  size={40}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{connection.company.name}</p>
                  <p className="truncate text-xs text-muted">{connection.company.city}</p>
                </div>
              </div>
            ))}
            {selectedConnections.length > 3 ? (
              <p className="text-xs text-muted">+{selectedConnections.length - 3} more</p>
            ) : null}
            <button
              type="button"
              className="self-start text-sm font-medium text-accent"
              onClick={() => setOpen(true)}
            >
              Change
            </button>
          </div>
        )
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-2xl border border-dashed border-line bg-foam px-3 py-3 text-left text-sm font-medium text-ink"
        >
          {chooseLabel}
        </button>
      )}

      <Sheet
        open={open}
        onClose={() => {
          setOpen(false);
          setQuery('');
        }}
        title={chooseLabel}
      >
        {list}
      </Sheet>
    </div>
  );
}
