import type { HomeNeedItem } from './homeAttention';

export interface HomeNeedVisual {
  action: string;
  party: string | null;
}

/**
 * Split a need for display: action is the hero, party is the business.
 * Does not change titles used for grouping or tests.
 */
export function homeNeedVisual(item: HomeNeedItem): HomeNeedVisual {
  const afterDot = splitDot(item.title);

  switch (item.kind) {
    case 'confirm_order': {
      const n = leadingCount(item.title);
      return {
        action: n ? `${n} orders to confirm` : 'Confirm this order',
        party: afterDot ?? partyAfter(item.title, 'Confirm order · '),
      };
    }
    case 'send_rate': {
      const n = leadingCount(item.title);
      const from = item.title.match(/^Order from (.+)$/);
      return {
        action: n ? `${n} need a rate` : 'Send rates',
        party: afterDot ?? from?.[1] ?? null,
      };
    }
    case 'accept_quote': {
      const n = leadingCount(item.title);
      return {
        action: n ? `${n} quotes to accept` : 'Accept this quote',
        party: afterDot ?? partyAfter(item.title, 'Accept quote · '),
      };
    }
    case 'dispatch': {
      const n = leadingCount(item.title);
      const to = item.title.match(/^Dispatch to (.+)$/);
      return {
        action: n ? `${n} to dispatch` : 'Dispatch',
        party: afterDot ?? to?.[1] ?? null,
      };
    }
    case 'review_return': {
      const many = item.title.match(/^(\d+) returns from (.+)$/);
      if (many) {
        return { action: `${many[1]} returns to review`, party: many[2] ?? null };
      }
      return {
        action: 'Review this return',
        party: afterDot ?? partyAfter(item.title, 'Review return · '),
      };
    }
    case 'access_request':
      return {
        action: 'Access request',
        party: afterDot ?? partyAfter(item.title, 'Access request · '),
      };
    case 'chat_request':
      return {
        action: 'Chat request',
        party: afterDot ?? partyAfter(item.title, 'Chat request · '),
      };
    case 'collection_view_granted': {
      if (item.title.startsWith('You can view · ')) {
        return {
          action: 'You can view this collection',
          party: item.subtitle,
        };
      }
      return { action: item.title, party: item.subtitle };
    }
    default:
      return { action: item.title, party: afterDot };
  }
}

function leadingCount(title: string): string | null {
  const match = title.match(/^(\d+)\s/);
  return match?.[1] ?? null;
}

function splitDot(title: string): string | null {
  const index = title.indexOf(' · ');
  if (index < 0) return null;
  return title.slice(index + 3).trim() || null;
}

function partyAfter(title: string, prefix: string): string | null {
  if (!title.startsWith(prefix)) return null;
  return title.slice(prefix.length).trim() || null;
}
