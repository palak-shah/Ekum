import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OwnerPackLifecycleSheet } from './OwnerPackLifecycleSheet';
import { packDeleteCopy } from './ownerPackLifecycle';
import { CollectionKind } from '@ekum/domain-types';

describe('OwnerPackLifecycleSheet', () => {
  it('Delete sheet has no Restore and can tick Also delete designs', async () => {
    const user = userEvent.setup();
    const onAlso = vi.fn();
    const copy = packDeleteCopy(CollectionKind.Catalog);
    render(
      <OwnerPackLifecycleSheet
        open
        onClose={() => undefined}
        title={copy.title}
        body={copy.body}
        alsoLabel={copy.alsoDeleteLabel}
        alsoOn
        onAlso={onAlso}
        confirmLabel={copy.confirmLabel}
        onConfirm={() => undefined}
      />,
    );
    expect(screen.getByText('Delete this catalog?')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^restore$/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Restore')).not.toBeInTheDocument();
    expect(screen.getByTestId('owner-pack-lifecycle-also')).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByTestId('owner-pack-lifecycle-also'));
    expect(onAlso).toHaveBeenCalledWith(false);
  });
});
