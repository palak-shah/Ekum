import { createElement, type ReactNode } from 'react';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Split text and wrap case-insensitive matches in a light mark.
 * Same mark as in-thread search — do not invent a second style.
 */
export function highlightSearchText(text: string, query: string | null | undefined): ReactNode {
  const needle = query?.trim();
  if (!needle || !text) return text;
  const pattern = new RegExp(`(${escapeRegExp(needle)})`, 'gi');
  const parts = text.split(pattern);
  if (parts.length === 1) return text;
  return parts.map((part, index) =>
    part.toLowerCase() === needle.toLowerCase()
      ? createElement(
          'mark',
          {
            key: `${index}-${part}`,
            className:
              'rounded-[3px] bg-warning-soft px-0.5 font-emphasis text-warning-ink [box-decoration-break:clone]',
          },
          part,
        )
      : part,
  );
}
