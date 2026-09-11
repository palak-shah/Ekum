import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { LONG_PRESS_SURFACE_CLASS, useLongPress } from './useLongPress';

function Probe({ onLong }: { onLong: () => void }) {
  const longPress = useLongPress(onLong, 50);
  return (
    <button type="button" className={LONG_PRESS_SURFACE_CLASS} data-testid="surface" {...longPress}>
      hold
    </button>
  );
}

describe('useLongPress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('exports a surface class for iOS callout suppression', () => {
    expect(LONG_PRESS_SURFACE_CLASS).toBe('ekum-long-press-surface');
  });

  it('fires long-press and swallows the following click', () => {
    const onLong = vi.fn();
    const onClick = vi.fn();
    const { getByTestId } = render(
      <div onClick={onClick}>
        <Probe onLong={onLong} />
      </div>,
    );
    const surface = getByTestId('surface');
    fireEvent.pointerDown(surface);
    vi.advanceTimersByTime(50);
    expect(onLong).toHaveBeenCalledTimes(1);
    fireEvent.pointerUp(surface);
    fireEvent.click(surface);
    expect(onClick).not.toHaveBeenCalled();
  });
});
