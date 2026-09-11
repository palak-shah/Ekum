import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useDiscardGuard } from './useDiscardGuard';

function dataRouterWrapper({ children }: { children: ReactNode }) {
  const router = createMemoryRouter(
    [{ path: '/', element: children }],
    { initialEntries: ['/'] },
  );
  return <RouterProvider router={router} />;
}

describe('useDiscardGuard beforeunload', () => {
  beforeEach(() => {
    document.documentElement.style.overscrollBehaviorY = '';
    document.body.style.overscrollBehaviorY = '';
  });

  afterEach(() => {
    document.documentElement.style.overscrollBehaviorY = '';
    document.body.style.overscrollBehaviorY = '';
  });

  it('arms browser leave prompt and blocks overscroll refresh while dirty', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');

    const { unmount, rerender } = renderHook(
      ({ active }) => useDiscardGuard(active),
      { initialProps: { active: true }, wrapper: dataRouterWrapper },
    );

    expect(document.documentElement.style.overscrollBehaviorY).toBe('none');
    expect(document.body.style.overscrollBehaviorY).toBe('none');

    const beforeUnload = add.mock.calls.find((call) => call[0] === 'beforeunload');
    expect(beforeUnload).toBeTruthy();
    const handler = beforeUnload![1] as (event: BeforeUnloadEvent) => void;
    const event = {
      preventDefault: vi.fn(),
      returnValue: undefined as string | undefined,
    };
    handler(event as unknown as BeforeUnloadEvent);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.returnValue).toBe('');

    rerender({ active: false });
    expect(document.documentElement.style.overscrollBehaviorY).toBe('');

    unmount();
    expect(remove).toHaveBeenCalledWith('beforeunload', expect.any(Function));

    add.mockRestore();
    remove.mockRestore();
  });

  it('does not arm beforeunload when idle', () => {
    const add = vi.spyOn(window, 'addEventListener');
    renderHook(() => useDiscardGuard(false), { wrapper: dataRouterWrapper });
    expect(add.mock.calls.some((call) => call[0] === 'beforeunload')).toBe(false);
    add.mockRestore();
  });
});
