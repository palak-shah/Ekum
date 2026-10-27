import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CollectionExpandableSection } from './CollectionExpandableSection';

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <CollectionExpandableSection
      title="Order and dispatch"
      open={open}
      onToggle={() => setOpen((value) => !value)}
      testId="expand"
    >
      <p>Fields</p>
    </CollectionExpandableSection>
  );
}

afterEach(() => cleanup());

describe('CollectionExpandableSection', () => {
  it('scrolls into view when opened, not on close', async () => {
    const user = userEvent.setup();
    const raf = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
    const scrollIntoView = vi.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;
    render(<Harness />);
    const toggle = screen.getByTestId('expand-toggle');
    await user.click(toggle);
    expect(screen.getByText('Fields')).toBeInTheDocument();
    await vi.waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalled();
    });
    const calls = scrollIntoView.mock.calls.length;
    await user.click(toggle);
    expect(screen.queryByText('Fields')).toBeNull();
    expect(scrollIntoView.mock.calls.length).toBe(calls);
    raf.mockRestore();
  });
});
