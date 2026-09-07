import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { ThreadForwardDock } from './ThreadForwardDock';

describe('ThreadForwardDock', () => {
  it('renders nothing when count is zero', () => {
    const { container } = render(
      <ThreadForwardDock
        open
        count={0}
        onCancel={() => undefined}
        onForward={() => undefined}
      />,
    );
    expect(container.querySelector('[data-testid="thread-forward-dock"]')).toBeNull();
  });

  it('renders dock when open with selection', () => {
    const { container } = render(
      <ThreadForwardDock
        open
        count={2}
        onCancel={() => undefined}
        onForward={() => undefined}
      />,
    );
    expect(container.querySelector('[data-testid="thread-forward-dock"]')).not.toBeNull();
    expect(container.textContent).toContain('2 selected');
  });
});
