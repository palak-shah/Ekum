import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CURATE_ASK_RELIST, CURATE_PACK_ONLY_SUMMARY } from './curateCheck';
import { RepostSkipSection, type RepostSkipRow } from './RepostSkipSection';

const silk: RepostSkipRow = {
  productId: 'p1',
  name: 'Silk',
  thumbUrl: null,
  companyId: 'mill',
  companyName: 'Mill',
};
const cotton: RepostSkipRow = {
  productId: 'p2',
  name: 'Cotton',
  thumbUrl: null,
  companyId: 'mill',
  companyName: 'Mill',
};

describe('RepostSkipSection', () => {
  it('lists eligible first and keeps skipped collapsed', async () => {
    const user = userEvent.setup();
    render(
      <RepostSkipSection
        allowed={[silk]}
        blocked={[{ ...cotton, code: 'NOT_DISCOVERABLE' }]}
        allowRelistAsk={false}
        trading
        pendingByProductId={{}}
        askingKey={null}
        onAsk={() => undefined}
        onAskAll={() => undefined}
      />,
    );
    expect(screen.getByTestId('repost-eligible-list')).toHaveTextContent('Silk');
    expect(screen.getByTestId('repost-skipped-toggle')).toHaveTextContent('Skipped designs (1)');
    expect(screen.queryByTestId('curate-blocked-list')).toBeNull();
    expect(screen.getByTestId('curate-skip-info')).toBeTruthy();
    await user.click(screen.getByTestId('repost-skipped-toggle'));
    expect(screen.getByTestId('curate-blocked-list')).toHaveTextContent('Cotton');
    expect(screen.getByTestId('curate-blocked-list')).not.toHaveTextContent(
      "Can't see this now",
    );
  });

  it('summarizes all-unavailable pack-only without Ask', () => {
    render(
      <RepostSkipSection
        allowed={[]}
        blocked={[
          { ...silk, code: 'NOT_DISCOVERABLE' },
          { ...cotton, code: 'INVALID_PRODUCTS' },
        ]}
        allowRelistAsk
        trading
        pendingByProductId={{}}
        askingKey={null}
        onAsk={() => undefined}
        onAskAll={() => undefined}
      />,
    );
    expect(screen.getByTestId('repost-unavailable-summary')).toHaveTextContent(
      '2 designs unavailable',
    );
    expect(screen.getByTestId('repost-unavailable-summary')).toHaveTextContent(
      CURATE_PACK_ONLY_SUMMARY,
    );
    expect(screen.queryByTestId('curate-blocked-ask')).toBeNull();
  });

  it('keeps Relist Ask on Cart skipped rows only', async () => {
    const user = userEvent.setup();
    const onAsk = vi.fn();
    render(
      <RepostSkipSection
        allowed={[silk]}
        blocked={[{ ...cotton, code: 'RELIST_NOT_ALLOWED' }]}
        allowRelistAsk
        trading
        pendingByProductId={{}}
        askingKey={null}
        onAsk={onAsk}
        onAskAll={() => undefined}
      />,
    );
    await user.click(screen.getByTestId('repost-skipped-toggle'));
    expect(screen.getByTestId('curate-blocked-ask')).toHaveTextContent(CURATE_ASK_RELIST);
    await user.click(screen.getByTestId('curate-blocked-ask'));
    expect(onAsk).toHaveBeenCalled();
  });

  it('does not Ask for look-only skips', async () => {
    const user = userEvent.setup();
    render(
      <RepostSkipSection
        allowed={[silk]}
        blocked={[{ ...cotton, code: 'FOLLOW_LOOK_ONLY' }]}
        allowRelistAsk
        trading
        pendingByProductId={{}}
        askingKey={null}
        onAsk={() => undefined}
        onAskAll={() => undefined}
      />,
    );
    await user.click(screen.getByTestId('repost-skipped-toggle'));
    expect(screen.queryByTestId('curate-blocked-ask')).toBeNull();
  });
});
