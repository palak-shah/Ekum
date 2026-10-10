import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SelectableMediaFrame } from './selectMediaChrome';

describe('SelectableMediaFrame', () => {
  it('shrinks selected media over page surface — check on, no teal frame', () => {
    const { container } = render(
      <SelectableMediaFrame selectMode selected>
        <img alt="" src="/x.jpg" />
      </SelectableMediaFrame>,
    );
    const frame = screen.getByTestId('selectable-media-selected');
    expect(frame.getAttribute('data-selected')).toBe('true');
    expect(frame.className).toContain('bg-surface');
    expect(frame.className).not.toContain('bg-accent');
    const media = container.querySelector('[data-testid="selectable-media-selected"] > div');
    expect(media?.className ?? '').toContain('scale-[0.92]');
    expect(media?.className ?? '').toContain('relative');
    const check = container.querySelector('[data-testid="selectable-media-selected"] > span');
    expect(check?.className).toContain('bg-accent');
    expect(check?.className).toContain('h-[18px]');
    expect(check?.className).toContain('w-[18px]');
    expect(check?.className).toContain('ring-1');
  });

  it('keeps in-media overlays inside the scaled photo (rate chip)', () => {
    const { container } = render(
      <SelectableMediaFrame selectMode selected>
        <img alt="" src="/x.jpg" />
        <span data-testid="rate-overlay">₹160/mtr</span>
      </SelectableMediaFrame>,
    );
    const media = container.querySelector('[data-testid="selectable-media-selected"] > div');
    expect(media?.querySelector('[data-testid="rate-overlay"]')).toBeTruthy();
    expect(media?.className ?? '').toContain('scale-[0.92]');
  });

  it('does not grey out or scale unselected media while Selecting', () => {
    const { container } = render(
      <SelectableMediaFrame selectMode selected={false}>
        <img alt="" src="/x.jpg" />
      </SelectableMediaFrame>,
    );
    const frame = screen.getByTestId('selectable-media');
    expect(frame.getAttribute('data-selected')).toBe('false');
    const media = container.querySelector('[data-testid="selectable-media"] > div');
    expect(media?.className ?? '').not.toMatch(/opacity-/);
    expect(media?.className ?? '').not.toContain('scale-[');
  });

  it('hides check when not in select mode', () => {
    const { container } = render(
      <SelectableMediaFrame selectMode={false} selected={false}>
        <img alt="" src="/x.jpg" />
      </SelectableMediaFrame>,
    );
    expect(container.querySelector('svg')).toBeNull();
  });
});
