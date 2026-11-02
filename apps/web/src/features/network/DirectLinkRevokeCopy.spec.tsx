import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DirectLinkRevokeCopy } from './DirectLinkRevokeCopy';

describe('Direct Link revoke confirm copy', () => {
  it('names existing orders unchanged and stops future routing/repost', () => {
    render(<DirectLinkRevokeCopy />);
    expect(screen.getByTestId('direct-link-revoke-copy')).toHaveTextContent(
      /remove the affected Direct Link/,
    );
    expect(screen.getByTestId('direct-link-revoke-copy')).toHaveTextContent(
      /Existing orders stay as they are/,
    );
    expect(screen.getByTestId('direct-link-revoke-copy')).toHaveTextContent(
      /automatic reposting will stop/,
    );
  });

  it('says Direct links go off when mill Share is revoked', () => {
    render(<DirectLinkRevokeCopy mode="off" />);
    expect(screen.getByTestId('direct-link-revoke-copy')).toHaveTextContent(
      /go off until they can share/,
    );
    expect(screen.getByTestId('direct-link-revoke-copy')).not.toHaveTextContent(/remove the affected/);
  });
});
