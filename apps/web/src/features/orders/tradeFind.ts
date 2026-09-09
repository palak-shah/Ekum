import { shortOrderLabel } from '@ekum/domain-types';
import { isTradingDeskOrder, linkedMillHaystack } from './tradeListRole';
import type { TradeListItem } from './tradeList';

export type TradeKindFacet = 'order' | 'sample' | 'return' | 'trading';

export type DateFacet = {
  from: string;
  to: string;
  label: string;
};

export type TradeFindState = {
  needle: string;
  kindFacet: TradeKindFacet | null;
  statusFacet: string | null;
  dateFacet: DateFacet | null;
};

export type SuggestionGroup = 'status' | 'type' | 'when' | 'match';

export type TradeSuggestion = {
  group: SuggestionGroup;
  /** Quiet trailing hint in the row (Status, Type, …). */
  hint: string;
  label: string;
} & (
  | { type: 'relative' | 'date'; date: DateFacet }
  | { type: 'kind'; kind: TradeKindFacet }
  | { type: 'status'; status: string }
  | { type: 'text'; value: string }
);

/** Primary statuses shown on empty focus (order lifecycle). */
const PRIMARY_STATUS_LABELS = [
  'Requested',
  'Confirmed',
  'Dispatched',
  'Settled',
] as const;

const MORE_STATUS_LABELS = [
  'Received',
  'Approved',
  'Resolved',
  'Declined',
  'Cancelled',
  'Converted',
  'Delivered',
] as const;

const ALL_STATUS_LABELS = [...PRIMARY_STATUS_LABELS, ...MORE_STATUS_LABELS];

const KIND_LABELS: { label: string; kind: TradeKindFacet }[] = [
  { label: 'Sample', kind: 'sample' },
  { label: 'Return', kind: 'return' },
  { label: 'Order', kind: 'order' },
  { label: 'Trading', kind: 'trading' },
];

/** Type words in Find (Trading also accepts linked). */
export function kindFacetFromNeedle(raw: string): TradeKindFacet | null {
  const word = raw.trim().toLowerCase();
  if (word === 'sample' || word === 'return' || word === 'order' || word === 'trading') {
    return word;
  }
  if (word === 'linked' || word === 'linked order' || word === 'i handle') return 'trading';
  return null;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function toDayString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

/** Monday-start local week → today (helpers / tests). */
export function relativeDateFacets(now = new Date()): DateFacet[] {
  const today = startOfLocalDay(now);
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + mondayOffset);

  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  return [
    { label: 'today', from: toDayString(today), to: toDayString(today) },
    {
      label: 'this week',
      from: toDayString(weekStart),
      to: toDayString(today),
    },
    {
      label: 'last month',
      from: toDayString(lastMonthStart),
      to: toDayString(lastMonthEnd),
    },
  ];
}

/**
 * Whole-query date words / typed dates for search.
 * Exact: today | yesterday | 18/08 | Aug | 2026-08-18
 */
export function dateFacetFromNeedle(raw: string, now = new Date()): DateFacet | null {
  const needle = raw.trim().toLowerCase();
  if (!needle) return null;

  if (needle === 'today') {
    const day = toDayString(startOfLocalDay(now));
    return { label: 'today', from: day, to: day };
  }
  if (needle === 'yesterday') {
    const y = startOfLocalDay(now);
    y.setDate(y.getDate() - 1);
    const day = toDayString(y);
    return { label: 'yesterday', from: day, to: day };
  }

  return parseTypedDate(raw, now);
}

/** Parse typed dates like 18/08, Aug, 2026-08-18 into a day or month range. */
export function parseTypedDate(raw: string, now = new Date()): DateFacet | null {
  const needle = raw.trim();
  if (!needle) return null;

  const iso = needle.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    if (Number.isNaN(d.getTime())) return null;
    const day = toDayString(d);
    return {
      label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      from: day,
      to: day,
    };
  }

  const dmy = needle.match(/^(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?$/);
  if (dmy) {
    const dayNum = Number(dmy[1]);
    const month = Number(dmy[2]) - 1;
    let year = dmy[3] ? Number(dmy[3]) : now.getFullYear();
    if (year < 100) year += 2000;
    const d = new Date(year, month, dayNum);
    if (d.getDate() !== dayNum || d.getMonth() !== month) return null;
    const key = toDayString(d);
    return {
      label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      from: key,
      to: key,
    };
  }

  const months = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
  ];
  const monthHit = months.findIndex((m) => needle.toLowerCase().startsWith(m));
  if (monthHit >= 0 && needle.length >= 3) {
    const yearMatch = needle.match(/(\d{4})/);
    const year = yearMatch ? Number(yearMatch[1]) : now.getFullYear();
    const from = new Date(year, monthHit, 1);
    const to = new Date(year, monthHit + 1, 0);
    return {
      label: from.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      from: toDayString(from),
      to: toDayString(to),
    };
  }

  return null;
}

function inDateRange(iso: string, facet: DateFacet): boolean {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  const from = startOfLocalDay(new Date(`${facet.from}T12:00:00`)).getTime();
  const to = endOfLocalDay(new Date(`${facet.to}T12:00:00`)).getTime();
  return t >= from && t <= to;
}

function itemStatus(item: TradeListItem): string {
  if (item.kind === 'order') return item.order.status;
  if (item.kind === 'sample') return item.sample.status;
  return item.ret.status;
}

function itemTextHaystack(item: TradeListItem): string {
  if (item.kind === 'order') {
    const o = item.order;
    const lines = o.items.map((i) => `${i.name} ${i.sku ?? ''}`).join(' ');
    const trading = isTradingDeskOrder(o) ? 'trading linked' : '';
    return `${o.counterpart.name} ${o.id} ${shortOrderLabel(o.id, { inquiry: o.intent === 'inquiry' })} ${linkedMillHaystack(o)} ${lines} ${o.intent} ${o.status} ${trading}`.toLowerCase();
  }
  if (item.kind === 'sample') {
    const s = item.sample;
    return `${s.name} ${s.counterpart.name} ${s.id} sample ${s.status}`.toLowerCase();
  }
  const r = item.ret;
  return `${r.counterpart.name} ${r.id} return ${r.status}`.toLowerCase();
}

function statusKeyFromLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, '_');
}

export function tradeMatchesFind(item: TradeListItem, find: TradeFindState): boolean {
  if (find.kindFacet === 'trading') {
    if (item.kind !== 'order' || !isTradingDeskOrder(item.order)) return false;
  } else if (find.kindFacet && item.kind !== find.kindFacet) {
    return false;
  }
  if (find.statusFacet && itemStatus(item) !== find.statusFacet) return false;

  const dateFromNeedle = dateFacetFromNeedle(find.needle);
  const dateFacet = find.dateFacet ?? dateFromNeedle;
  if (dateFacet && !inDateRange(item.createdAt, dateFacet)) return false;

  // Needle is only a date word / typed date — date filter is enough.
  if (dateFromNeedle && !find.dateFacet) return true;

  const needle = find.needle.trim().toLowerCase();
  if (needle.length === 0) return true;

  const status = itemStatus(item);
  if (status === needle || status.replace(/_/g, ' ').startsWith(needle) || status.startsWith(needle)) {
    return true;
  }
  if (item.kind === needle || (needle === 'inquiry' && item.kind === 'order')) {
    return true;
  }
  return itemTextHaystack(item).includes(needle);
}

export function buildTradeSuggestions(
  items: TradeListItem[],
  needleRaw: string,
  now = new Date(),
): TradeSuggestion[] {
  const needle = needleRaw.trim();
  const lower = needle.toLowerCase();
  const out: TradeSuggestion[] = [];
  const seen = new Set<string>();
  const limit = needle ? 10 : 12;

  const push = (key: string, suggestion: TradeSuggestion) => {
    if (seen.has(key) || out.length >= limit) return;
    seen.add(key);
    out.push(suggestion);
  };

  if (!needle) {
    for (const label of PRIMARY_STATUS_LABELS) {
      push(`status:${statusKeyFromLabel(label)}`, {
        type: 'status',
        group: 'status',
        hint: 'Status',
        label,
        status: statusKeyFromLabel(label),
      });
    }
    for (const k of KIND_LABELS) {
      if (k.kind === 'order') continue;
      push(`kind:${k.kind}`, {
        type: 'kind',
        group: 'type',
        hint: 'Type',
        label: k.label,
        kind: k.kind,
      });
    }
    return out;
  }

  const typed = parseTypedDate(needle, now);
  if (typed) {
    push(`date:${typed.from}:${typed.to}`, {
      type: 'date',
      group: 'when',
      hint: 'When',
      label: typed.label,
      date: typed,
    });
  }

  for (const rel of relativeDateFacets(now)) {
    if (rel.label.toLowerCase().includes(lower) || lower === 'today' || lower === 'week' || lower === 'month') {
      if (
        rel.label.toLowerCase().includes(lower) ||
        (lower === 'today' && rel.label.includes('today')) ||
        (lower === 'week' && rel.label.includes('week')) ||
        (lower === 'month' && rel.label.includes('month'))
      ) {
        push(`date:${rel.label}`, {
          type: 'relative',
          group: 'when',
          hint: 'When',
          label: rel.label,
          date: rel,
        });
      }
    }
  }

  if (lower.length >= 3 && 'linked'.startsWith(lower)) {
    push('kind:trading', {
      type: 'kind',
      group: 'type',
      hint: 'Type',
      label: 'Trading',
      kind: 'trading',
    });
  }

  for (const k of KIND_LABELS) {
    if (k.label.toLowerCase().startsWith(lower) || k.kind.startsWith(lower)) {
      push(`kind:${k.kind}`, {
        type: 'kind',
        group: 'type',
        hint: 'Type',
        label: k.label,
        kind: k.kind,
      });
    }
  }

  for (const label of ALL_STATUS_LABELS) {
    if (label.toLowerCase().startsWith(lower)) {
      push(`status:${statusKeyFromLabel(label)}`, {
        type: 'status',
        group: 'status',
        hint: 'Status',
        label,
        status: statusKeyFromLabel(label),
      });
    }
  }
  if ('partially_approved'.startsWith(lower) || 'partial'.startsWith(lower)) {
    push('status:partially_approved', {
      type: 'status',
      group: 'status',
      hint: 'Status',
      label: 'Partially approved',
      status: 'partially_approved',
    });
  }

  for (const item of items) {
    if (item.kind === 'order') {
      const name = item.order.counterpart.name.trim();
      if (name && name.toLowerCase().includes(lower)) {
        push(`text:co:${name.toLowerCase()}`, {
          type: 'text',
          group: 'match',
          hint: 'Company',
          label: name,
          value: name,
        });
      }
      for (const line of item.order.items) {
        if (line.name.toLowerCase().includes(lower)) {
          push(`text:n:${line.name.toLowerCase()}`, {
            type: 'text',
            group: 'match',
            hint: 'Design',
            label: line.name,
            value: line.name,
          });
        }
        if (line.sku && line.sku.toLowerCase().includes(lower)) {
          push(`text:sku:${line.sku.toLowerCase()}`, {
            type: 'text',
            group: 'match',
            hint: 'SKU',
            label: line.sku,
            value: line.sku,
          });
        }
      }
    } else if (item.kind === 'sample') {
      const name = item.sample.counterpart.name.trim();
      if (name && name.toLowerCase().includes(lower)) {
        push(`text:co:${name.toLowerCase()}`, {
          type: 'text',
          group: 'match',
          hint: 'Company',
          label: name,
          value: name,
        });
      }
      if (item.sample.name.toLowerCase().includes(lower)) {
        push(`text:sn:${item.sample.name.toLowerCase()}`, {
          type: 'text',
          group: 'match',
          hint: 'Sample',
          label: item.sample.name,
          value: item.sample.name,
        });
      }
    } else {
      const name = item.ret.counterpart.name.trim();
      if (name && name.toLowerCase().includes(lower)) {
        push(`text:co:${name.toLowerCase()}`, {
          type: 'text',
          group: 'match',
          hint: 'Company',
          label: name,
          value: name,
        });
      }
    }
  }

  return out;
}

export function groupTradeSuggestions(
  suggestions: TradeSuggestion[],
): { group: SuggestionGroup; title: string; items: TradeSuggestion[] }[] {
  const titles: Record<SuggestionGroup, string> = {
    status: 'Status',
    type: 'Type',
    when: 'Created',
    match: 'Matches',
  };
  const order: SuggestionGroup[] = ['status', 'type', 'when', 'match'];
  return order
    .map((group) => ({
      group,
      title: titles[group],
      items: suggestions.filter((s) => s.group === group),
    }))
    .filter((g) => g.items.length > 0);
}

export function findNeedsServer(find: TradeFindState): boolean {
  return (
    (find.needle.trim().length >= 2 && !dateFacetFromNeedle(find.needle)) ||
    Boolean(find.dateFacet) ||
    Boolean(dateFacetFromNeedle(find.needle))
  );
}

/** Effective created range for API (explicit facet or date typed in search). */
export function effectiveDateFacet(find: TradeFindState): DateFacet | null {
  return find.dateFacet ?? dateFacetFromNeedle(find.needle);
}

export function emptyFindState(): TradeFindState {
  return { needle: '', kindFacet: null, statusFacet: null, dateFacet: null };
}
