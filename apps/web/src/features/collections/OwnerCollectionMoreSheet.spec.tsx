import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OwnerCollectionMoreSheet } from './OwnerCollectionMoreSheet';

describe('OwnerCollectionMoreSheet', () => {
  it('lists Share · Bookmark · Who · manage trio · Edit with the collection title', async () => {
    const user = userEvent.setup();
    const onShare = vi.fn();
    const onBookmark = vi.fn();
    const onWho = vi.fn();
    const onAddDesigns = vi.fn();
    const onAddPhotos = vi.fn();
    const onReplace = vi.fn();
    const onEdit = vi.fn();
    const onClose = vi.fn();
    render(
      <OwnerCollectionMoreSheet
        open
        title="Monsoon Cottons"
        onClose={onClose}
        onShare={onShare}
        onBookmark={onBookmark}
        onWhoHasAccess={onWho}
        onAddDesigns={onAddDesigns}
        onAddPhotos={onAddPhotos}
        onReplace={onReplace}
        onEditDetails={onEdit}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Monsoon Cottons' })).toBeInTheDocument();
    expect(screen.getByTestId('collection-menu-share')).toHaveTextContent('Share this collection');
    expect(screen.getByTestId('collection-menu-bookmark')).toHaveTextContent(
      'Bookmark this collection',
    );
    expect(screen.getByTestId('collection-menu-who')).toHaveTextContent('Who has access');
    expect(screen.getByTestId('collection-menu-add-designs')).toHaveTextContent(
      'Add from existing designs',
    );
    expect(screen.getByTestId('collection-menu-add-photos')).toHaveTextContent('Add photos');
    expect(screen.getByTestId('collection-menu-replace')).toHaveTextContent(
      'Replace entire collection',
    );
    expect(screen.getByTestId('collection-menu-edit')).toHaveTextContent('Edit collection details');
    expect(screen.queryByTestId('collection-menu-draft')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('collection-menu-add-designs'));
    expect(onClose).toHaveBeenCalled();
    expect(onAddDesigns).toHaveBeenCalled();

    onClose.mockClear();
    await user.click(screen.getByTestId('collection-menu-replace'));
    expect(onClose).toHaveBeenCalled();
    expect(onReplace).toHaveBeenCalled();
  });

  it('General Collection ⋯ is Bookmark · Edit only', () => {
    render(
      <OwnerCollectionMoreSheet
        open
        title="Shop leftover"
        isGeneral
        onClose={() => undefined}
        onShare={() => undefined}
        onBookmark={() => undefined}
        onWhoHasAccess={() => undefined}
        onAddDesigns={() => undefined}
        onAddPhotos={() => undefined}
        onReplace={() => undefined}
        onEditDetails={() => undefined}
      />,
    );
    expect(screen.getByTestId('collection-menu-bookmark')).toBeInTheDocument();
    expect(screen.getByTestId('collection-menu-edit')).toBeInTheDocument();
    expect(screen.queryByTestId('collection-menu-share')).not.toBeInTheDocument();
    expect(screen.queryByTestId('collection-menu-add-designs')).not.toBeInTheDocument();
    expect(screen.queryByTestId('collection-menu-add-photos')).not.toBeInTheDocument();
    expect(screen.queryByTestId('collection-menu-replace')).not.toBeInTheDocument();
    expect(screen.queryByTestId('collection-menu-who')).not.toBeInTheDocument();
    expect(screen.queryByTestId('collection-menu-draft')).not.toBeInTheDocument();
  });

  it('published pack ⋯ ends with Draft this collection', async () => {
    const user = userEvent.setup();
    const onDraft = vi.fn();
    const onClose = vi.fn();
    render(
      <OwnerCollectionMoreSheet
        open
        title="Monsoon Cottons"
        canDraft
        onClose={onClose}
        onShare={() => undefined}
        onBookmark={() => undefined}
        onWhoHasAccess={() => undefined}
        onAddDesigns={() => undefined}
        onAddPhotos={() => undefined}
        onReplace={() => undefined}
        onEditDetails={() => undefined}
        onDraft={onDraft}
      />,
    );
    expect(screen.getByTestId('collection-menu-draft')).toHaveTextContent(
      'Draft this collection',
    );
    await user.click(screen.getByTestId('collection-menu-draft'));
    expect(onClose).toHaveBeenCalled();
    expect(onDraft).toHaveBeenCalled();
  });

  it('catalog pack ⋯ uses catalog, never collection', () => {
    render(
      <OwnerCollectionMoreSheet
        open
        title="Diwali drop"
        kind="catalog"
        canDraft
        draftLabel="Draft this catalog"
        onClose={() => undefined}
        onShare={() => undefined}
        onBookmark={() => undefined}
        onWhoHasAccess={() => undefined}
        onAddDesigns={() => undefined}
        onAddPhotos={() => undefined}
        onReplace={() => undefined}
        onEditDetails={() => undefined}
        onDraft={() => undefined}
      />,
    );
    expect(screen.getByTestId('collection-menu-share')).toHaveTextContent('Share this catalog');
    expect(screen.getByTestId('collection-menu-bookmark')).toHaveTextContent(
      'Bookmark this catalog',
    );
    expect(screen.getByTestId('collection-menu-replace')).toHaveTextContent(
      'Replace entire catalog',
    );
    expect(screen.getByTestId('collection-menu-edit')).toHaveTextContent('Edit catalog details');
    expect(screen.getByTestId('collection-menu-draft')).toHaveTextContent('Draft this catalog');
    expect(screen.getByTestId('owner-collection-more-sheet').textContent).not.toMatch(
      /\bcollection\b/i,
    );
  });
});
