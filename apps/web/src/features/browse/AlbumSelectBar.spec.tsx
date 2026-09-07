import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AlbumSelectBar } from './AlbumSelectBar';

vi.mock('@/lib/tradePresence', () => ({
  useTradePresence: () => ({ trading: true, buying: true, selling: true }),
}));

describe('AlbumSelectBar', () => {
  it('shows Order Curate Bookmark Share for designs only', () => {
    render(
      <AlbumSelectBar
        albumCount={0}
        designCount={2}
        onClear={() => {}}
        onOrder={() => {}}
        onCurate={() => {}}
        onSave={() => {}}
        onShare={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: 'Order' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Curate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bookmark' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
  });

  it('shows the same four actions for collections only', () => {
    render(
      <AlbumSelectBar
        albumCount={1}
        designCount={0}
        onClear={() => {}}
        onOrder={() => {}}
        onCurate={() => {}}
        onSave={() => {}}
        onShare={() => {}}
      />,
    );
    expect(screen.getByText('1 collection selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Order' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Curate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bookmark' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
  });

  it('shows the same four actions for mixed selection', () => {
    render(
      <AlbumSelectBar
        albumCount={1}
        designCount={4}
        onClear={() => {}}
        onOrder={() => {}}
        onCurate={() => {}}
        onSave={() => {}}
        onShare={() => {}}
      />,
    );
    expect(screen.getByText('4 designs · 1 collection')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Order' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Curate' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Bookmark' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Share' })).toHaveLength(1);
  });
});
