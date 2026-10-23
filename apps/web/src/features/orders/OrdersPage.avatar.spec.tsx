import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from '@/ui/kit';
import { initials } from '@/lib/format';

vi.mock('@/lib/mediaUrl', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/mediaUrl')>();
  return { ...actual, toAbsoluteMediaUrl: (url: string) => url };
});

const TRADE_LIST_AVATAR_SIZE = 48;

function TradeListMedia({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl: string | null;
}) {
  return (
    <div className="h-12 w-12 shrink-0" data-testid="trade-list-media">
      <Avatar name={name} imageUrl={logoUrl} size={TRADE_LIST_AVATAR_SIZE} />
    </div>
  );
}

describe('Orders list counterpart avatar', () => {
  it('shows initials when there is no profile logo (BM-11)', () => {
    const name = 'Ahmedabad Loom Co';
    render(<TradeListMedia name={name} logoUrl={null} />);
    expect(screen.getByTestId('trade-list-media')).toBeTruthy();
    expect(screen.queryByTestId('trade-list-thumb')).toBeNull();
    expect(screen.getByText(initials(name))).toBeTruthy();
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('shows the shop logo when logoUrl is set', () => {
    const name = 'Surat Silks';
    render(
      <TradeListMedia name={name} logoUrl="https://cdn.example/logo.jpg" />,
    );
    expect(screen.getByTestId('trade-list-media')).toBeTruthy();
    expect(screen.queryByTestId('trade-list-thumb')).toBeNull();
    const img = screen.getByRole('img', { name });
    expect(img).toHaveAttribute('src', 'https://cdn.example/logo.jpg');
  });
});
