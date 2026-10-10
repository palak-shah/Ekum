import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ExploreFeedCaption } from './ExploreFeedCaption';
import { ExploreFeedMeasureContext } from './exploreFeedMeasure';
import * as chrome from '@/features/collections/collectionViewerChrome';

afterEach(() => cleanup());

describe('ExploreFeedCaption virtual remasure', () => {
  it('asks the feed to remasure when read more expands', async () => {
    const user = userEvent.setup();
    const remeasure = vi.fn();
    vi.spyOn(chrome, 'noteBlockOverflows').mockReturnValue(true);
    render(
      <ExploreFeedMeasureContext.Provider value={remeasure}>
        <ExploreFeedCaption
          title="Ethnic collection"
          about={'Line one.\nLine two.\nLine three.\nLine four.'}
        />
      </ExploreFeedMeasureContext.Provider>,
    );
    remeasure.mockClear();
    await user.click(screen.getByTestId('explore-feed-about'));
    expect(screen.getByTestId('explore-feed-about')).toHaveTextContent('Show less');
    expect(remeasure).toHaveBeenCalled();
  });
});
