import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PhotoViewer } from './PhotoViewer';

afterEach(() => cleanup());

describe('PhotoViewer', () => {
  it('renders nothing when closed', () => {
    render(
      <PhotoViewer open={false} urls={['a.jpg']} index={0} onIndex={() => {}} onClose={() => {}} />,
    );
    expect(screen.queryByTestId('photo-viewer')).toBeNull();
  });

  it('hides counter for a single photo', () => {
    render(
      <PhotoViewer open urls={['a.jpg']} index={0} onIndex={() => {}} onClose={() => {}} />,
    );
    expect(screen.getByTestId('photo-viewer')).toBeTruthy();
    expect(screen.queryByTestId('photo-viewer-counter')).toBeNull();
  });

  it('next arrow moves to the following photo', async () => {
    const onIndex = vi.fn();
    render(
      <PhotoViewer
        open
        urls={['a.jpg', 'b.jpg']}
        index={0}
        onIndex={onIndex}
        onClose={() => {}}
      />,
    );
    await userEvent.click(screen.getByTestId('photo-viewer-next'));
    expect(onIndex).toHaveBeenCalledWith(1);
    expect(screen.queryByTestId('photo-viewer-prev')).toBeNull();
  });

  it('shows N / M and closes', async () => {
    const onClose = vi.fn();
    render(
      <PhotoViewer
        open
        urls={['a.jpg', 'b.jpg']}
        index={0}
        onIndex={() => {}}
        onClose={onClose}
      />,
    );
    expect(screen.getByTestId('photo-viewer-counter')).toHaveTextContent('1 / 2');
    await userEvent.click(screen.getByTestId('photo-viewer-close'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows design name and qty/rate detail', () => {
    render(
      <PhotoViewer
        open
        urls={['a.jpg']}
        index={0}
        onIndex={() => {}}
        onClose={() => {}}
        captions={['Floral voile']}
        details={['200 × ₹85/pc · EK-AB12']}
      />,
    );
    expect(screen.getByTestId('photo-viewer-caption')).toHaveTextContent('Floral voile');
    expect(screen.getByTestId('photo-viewer-detail')).toHaveTextContent(
      '200 × ₹85/pc · EK-AB12',
    );
  });

  it('portals above shell chrome (body + z-100)', () => {
    render(
      <PhotoViewer open urls={['a.jpg']} index={0} onIndex={() => {}} onClose={() => {}} />,
    );
    const bar = screen.getByTestId('photo-viewer');
    expect(bar.parentElement).toBe(document.body);
    expect(bar.className).toMatch(/z-\[100\]/);
  });
});
