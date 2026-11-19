import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  BOTTOM_DOCK_CLEARANCE_CLASS,
  DockIconButton,
  SELECTION_DOCK_CLEARANCE_CLASS,
  bottomTradeDockClass,
} from './BottomTradeDock';

describe('DockIconButton soft disable', () => {
  it('keeps opacity and toasts via onDisabledClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onDisabledClick = vi.fn();
    render(
      <DockIconButton
        testId="dock-repost"
        label="Repost"
        disabled
        onDisabledClick={onDisabledClick}
        onClick={onClick}
      >
        <span>icon</span>
      </DockIconButton>,
    );
    const btn = screen.getByTestId('dock-repost');
    expect(btn).toHaveAttribute('aria-disabled', 'true');
    expect(btn).not.toBeDisabled();
    expect(btn.className).toMatch(/opacity-40/);
    await user.click(btn);
    expect(onDisabledClick).toHaveBeenCalledOnce();
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('bottomTradeDockClass', () => {
  it('takes pointer events above the tab bar so Ask / Order are not dead taps', () => {
    const cls = bottomTradeDockClass(false);
    expect(cls).toContain('pointer-events-auto');
    expect(cls).toContain('z-50');
    expect(cls).toContain('bottom-0');
    expect(cls).toContain('bg-surface/95');
  });

  it('sits above the tab bar only when the page still shows nav', () => {
    const cls = bottomTradeDockClass(true);
    expect(cls).toContain('bottom-20');
    expect(cls).not.toMatch(/(?:^|\s)bottom-0(?:\s|$)/);
  });

  it('Order clearance is tighter than selection dock clearance', () => {
    expect(BOTTOM_DOCK_CLEARANCE_CLASS).toContain('5rem');
    expect(SELECTION_DOCK_CLEARANCE_CLASS).toContain('7rem');
  });
});
