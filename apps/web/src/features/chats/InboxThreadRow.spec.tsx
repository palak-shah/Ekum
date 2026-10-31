import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ThreadSummary } from '@ekum/domain-types';
import { InboxThreadRow } from './InboxThreadRow';

const thread = {
  id: 't1',
  type: 'direct',
  visibility: 'trade',
  title: 'Surat Silk',
  state: 'active',
  alertLevel: 'all',
  pinned: false,
  unreadCount: 0,
  lastMessage: null,
  lastMessageAt: new Date().toISOString(),
  counterpart: { id: 'c1', name: 'Surat Silk', logoUrl: null },
  participantCount: 2,
} as ThreadSummary;

function renderSelectRow(opts: { selected: boolean; onToggle: () => void }) {
  return render(
    <MemoryRouter>
      <InboxThreadRow
        thread={thread}
        selecting
        selected={opts.selected}
        canMenu={false}
        onMenu={() => undefined}
        onToggle={opts.onToggle}
      />
    </MemoryRouter>,
  );
}

function swipe(row: HTMLElement, fromX: number, toX: number) {
  Object.defineProperty(row, 'setPointerCapture', { value: vi.fn() });
  fireEvent.pointerDown(row, { clientX: fromX, clientY: 40, pointerId: 1 });
  fireEvent.pointerMove(row, { clientX: toX, clientY: 44, pointerId: 1 });
  fireEvent.pointerUp(row, { pointerId: 1 });
}

describe('InboxThreadRow select swipe', () => {
  afterEach(() => cleanup());

  it('swipes right to select when off', () => {
    const onToggle = vi.fn();
    renderSelectRow({ selected: false, onToggle });
    const row = screen.getByTestId('chats-select-row-t1');
    swipe(row, 40, 120);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('swipes left to deselect when on', () => {
    const onToggle = vi.fn();
    renderSelectRow({ selected: true, onToggle });
    const row = screen.getByTestId('chats-select-row-t1');
    swipe(row, 120, 40);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('does not deselect an unselected row on swipe left', () => {
    const onToggle = vi.fn();
    renderSelectRow({ selected: false, onToggle });
    const row = screen.getByTestId('chats-select-row-t1');
    swipe(row, 120, 40);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('does not select again when already on', () => {
    const onToggle = vi.fn();
    renderSelectRow({ selected: true, onToggle });
    const row = screen.getByTestId('chats-select-row-t1');
    swipe(row, 40, 120);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('lets a vertical flick stay a list scroll', () => {
    const onToggle = vi.fn();
    renderSelectRow({ selected: false, onToggle });
    const row = screen.getByTestId('chats-select-row-t1');
    Object.defineProperty(row, 'setPointerCapture', { value: vi.fn() });
    fireEvent.pointerDown(row, { clientX: 40, clientY: 40, pointerId: 1 });
    fireEvent.pointerMove(row, { clientX: 44, clientY: 120, pointerId: 1 });
    fireEvent.pointerUp(row, { pointerId: 1 });
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('still toggles on tap', () => {
    const onToggle = vi.fn();
    renderSelectRow({ selected: false, onToggle });
    fireEvent.click(screen.getByTestId('chats-select-row-t1'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

describe('InboxThreadRow Ink & Lime chrome', () => {
  afterEach(() => cleanup());

  it('folds object kind onto the preview line and uses a hairline + foam press', () => {
    const withPhoto = {
      ...thread,
      lastMessage: {
        id: 'm1',
        type: 'photo',
        body: null,
        mine: false,
        createdAt: new Date().toISOString(),
        senderCompanyId: 'c1',
        metadata: { urls: ['https://example.com/a.jpg'] },
        reference: null,
      },
    } as ThreadSummary;
    render(
      <MemoryRouter>
        <InboxThreadRow
          thread={withPhoto}
          selecting
          selected={false}
          canMenu={false}
          onMenu={() => undefined}
          onToggle={() => undefined}
        />
      </MemoryRouter>,
    );
    const row = screen.getByTestId('chats-select-row-t1');
    expect(row.textContent?.match(/Photo/g)?.length).toBe(1);
    expect(row.className).toMatch(/border-b/);
    expect(row.className).toContain('hover:bg-foam');
    expect(row.className).not.toContain('hover:bg-canvas');
  });

  it('prefixes kind when the preview does not already start with it', () => {
    const withCollection = {
      ...thread,
      lastMessage: {
        id: 'm2',
        type: 'collection_card',
        body: null,
        mine: false,
        createdAt: new Date().toISOString(),
        senderCompanyId: 'c1',
        metadata: null,
        reference: { id: 'col1', kind: 'collection', name: 'Summer' },
      },
    } as ThreadSummary;
    render(
      <MemoryRouter>
        <InboxThreadRow
          thread={withCollection}
          selecting
          selected={false}
          canMenu={false}
          onMenu={() => undefined}
          onToggle={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('chats-select-row-t1').textContent).toMatch(
      /Collection Shared: Summer/,
    );
    const kind = screen.getByTestId('inbox-kind');
    expect(kind).toHaveTextContent('Collection');
    expect(kind.className).toContain('font-title');
    expect(kind.className).toContain('text-chip-on-ink');
  });

  it('uses a people glyph when a group has no photo', () => {
    const group = {
      ...thread,
      type: 'group',
      title: 'Yash · Ethonique',
      imageUrl: null,
    } as ThreadSummary;
    render(
      <MemoryRouter>
        <InboxThreadRow
          thread={group}
          selecting={false}
          selected={false}
          canMenu={false}
          onMenu={() => undefined}
          onToggle={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('avatar-group-fallback')).toBeInTheDocument();
  });
});


