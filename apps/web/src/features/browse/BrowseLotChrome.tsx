import type { ReactNode } from 'react';
import { SearchInput } from '@/ui/kit';
import type { DesignBrowseLayout } from '@/lib/designBrowseLayout';
import { BrowseLayoutToggle } from '@/ui/BrowseLayoutToggle';
import { CatalogFindToggle } from '@/features/catalog/catalogFindToggle';
import { SelectModeControls } from './SelectModeControls';

/**
 * Find · Select mode · Feed/Grid tools row, then optional find field, then list children.
 */
export function BrowseLotChrome({
  findOpen,
  findLabel,
  findTestId,
  findInputTestId,
  findPlaceholder,
  findValue,
  onFindToggle,
  onFindChange,
  findPanel,
  selecting,
  selectedCount,
  allSelected,
  onEnterSelect,
  onSelectAll,
  onClear,
  showSelectAll = true,
  selectTestId,
  canSelect = true,
  layout,
  layoutTestId,
  onLayoutToggle,
  children,
}: {
  findOpen?: boolean;
  findLabel?: string;
  findTestId?: string;
  findInputTestId?: string;
  findPlaceholder?: string;
  findValue?: string;
  onFindToggle?: () => void;
  onFindChange?: (value: string) => void;
  /** Replaces the default find field (e.g. You library search + filter). */
  findPanel?: ReactNode;
  selecting: boolean;
  selectedCount: number;
  allSelected: boolean;
  onEnterSelect: () => void;
  onSelectAll: () => void;
  onClear: () => void;
  showSelectAll?: boolean;
  selectTestId?: string;
  canSelect?: boolean;
  layout?: DesignBrowseLayout;
  layoutTestId?: string;
  onLayoutToggle?: () => void;
  children?: ReactNode;
}) {
  const showFind = Boolean(onFindToggle);
  const showLayout = Boolean(layout && onLayoutToggle);

  return (
    <div className="flex flex-col gap-1.5" data-testid="browse-lot-chrome">
      <div className="flex items-center gap-1 px-0.5">
        {showFind ? (
          <CatalogFindToggle
            testId={findTestId ?? 'browse-lot-find-toggle'}
            open={Boolean(findOpen)}
            label={findLabel ?? 'Find'}
            onToggle={onFindToggle!}
          />
        ) : null}
        {canSelect ? (
          <SelectModeControls
            selecting={selecting}
            count={selectedCount}
            allSelected={allSelected}
            onEnterSelect={onEnterSelect}
            onSelectAll={onSelectAll}
            onClear={onClear}
            showSelectAll={showSelectAll}
            selectTestId={selectTestId}
          />
        ) : null}
        {showLayout ? (
          <div className="ml-auto">
            <BrowseLayoutToggle
              layout={layout!}
              testId={layoutTestId}
              onToggle={onLayoutToggle!}
            />
          </div>
        ) : null}
      </div>
      {showFind && findOpen ? (
        findPanel !== undefined ? (
          findPanel
        ) : (
          <SearchInput
            data-testid={findInputTestId ?? 'browse-lot-find'}
            aria-label={findLabel ?? 'Find'}
            placeholder={findPlaceholder ?? findLabel ?? 'Find'}
            value={findValue ?? ''}
            onChange={(event) => onFindChange?.(event.target.value)}
          />
        )
      ) : null}
      {children}
    </div>
  );
}
