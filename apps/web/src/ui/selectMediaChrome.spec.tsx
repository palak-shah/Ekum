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
    expect(media?.className ?? '').toContain('scale-[0.97]');
    const check = container.querySelector('[data-testid="selectable-media-selected"] > span');
    expect(check?.className).toContain('bg-accent');
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
