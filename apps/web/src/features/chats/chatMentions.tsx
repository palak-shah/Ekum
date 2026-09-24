import { createElement, type ReactNode } from 'react';
import type { MessageMention } from '@ekum/domain-types';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function highlightMentionText(
  text: string,
  mentions: MessageMention[],
  tone: 'mine' | 'theirs',
): ReactNode {
  if (!text || mentions.length === 0) return text;
  const names = [...new Set(mentions.map((row) => row.name.trim()).filter(Boolean))].sort(
    (a, b) => b.length - a.length,
  );
  if (names.length === 0) return text;
  const pattern = new RegExp(`(@(?:${names.map(escapeRegExp).join('|')}))`, 'g');
  const parts = text.split(pattern);
  if (parts.length === 1) return text;
  const mark = new Set(names.map((name) => `@${name}`));
  return parts.map((part, index) =>
    mark.has(part)
      ? createElement(
          'span',
          {
            key: `${index}-${part}`,
            className:
              tone === 'mine'
                ? 'font-semibold text-white underline decoration-white/70 underline-offset-2'
                : 'font-semibold text-accent',
          },
          part,
        )
      : part,
  );
}
