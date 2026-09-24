import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  PWA_UPDATE_ACTION,
  PWA_UPDATE_MESSAGE,
  PwaUpdateBar,
} from './pwaUpdate';

describe('PwaUpdateBar', () => {
  it('hides until a new build is waiting', () => {
    render(<PwaUpdateBar open={false} onLoad={() => {}} />);
    expect(screen.queryByTestId('pwa-update-bar')).toBeNull();
  });

  it('asks to Load and does not reload until they tap', async () => {
    const onLoad = vi.fn();
    const user = userEvent.setup();
    render(<PwaUpdateBar open onLoad={onLoad} />);

    const bar = screen.getByTestId('pwa-update-bar');
    expect(bar).toHaveTextContent(PWA_UPDATE_MESSAGE);
    expect(screen.getByRole('button', { name: PWA_UPDATE_ACTION })).toBeTruthy();
    expect(onLoad).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: PWA_UPDATE_ACTION }));
    expect(onLoad).toHaveBeenCalledTimes(1);
  });
});
