import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { SEE_PACKS_ASK_LINE, SHARE_PACKS_ASK_LINE } from '@/features/company/seePacksCopy';
import { FollowAskHeader } from './FollowAskDecideRow';

describe('FollowAskHeader', () => {
  it('shows the shop name and full why-line', () => {
    render(
      <MemoryRouter>
        <FollowAskHeader name="Jaipur Emporium" logoUrl={null} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Jaipur Emporium')).toBeInTheDocument();
    expect(screen.getByTestId('follow-ask-why')).toHaveTextContent(SEE_PACKS_ASK_LINE);
  });

  it('names all-collections Share on a Direct Link ask', () => {
    render(
      <MemoryRouter>
        <FollowAskHeader name="Yash Fabrics" logoUrl={null} kind="share" />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('follow-ask-why')).toHaveTextContent(SHARE_PACKS_ASK_LINE);
    expect(screen.getByTestId('follow-ask-subline')).toHaveTextContent(
      'They can put your collections in their catalog',
    );
  });
});
