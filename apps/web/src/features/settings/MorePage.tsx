import { MyCatalogPage } from '@/features/catalog/MyCatalogPage';
import { useTradePresence } from '@/lib/tradePresence';

/** My collections root — title + Back (Home) + account avatar live in AppShell. */
export function MorePage() {
  const { selling, trading } = useTradePresence();
  const showLibrary = selling || trading;

  return (
    <div className="flex flex-col gap-4 pt-3">
      <MyCatalogPage embedded catalogTabs={showLibrary} />
    </div>
  );
}
