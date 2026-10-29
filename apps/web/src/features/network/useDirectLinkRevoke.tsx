import { useState } from 'react';
import type { AffectedTradeLanesView, TradeLaneView } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useToast } from '@/ui/Toast';
import { Button, Sheet } from '@/ui/kit';
import { DirectLinkRevokeCopy } from './DirectLinkRevokeCopy';

export function useDirectLinkRevoke(onConfirm: (companyId: string) => void, pending: boolean) {
  const { showToast } = useToast();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [lanes, setLanes] = useState<TradeLaneView[]>([]);
  const [checking, setChecking] = useState(false);

  const maybeConfirm = async (nextCompanyId: string) => {
    setChecking(true);
    try {
      const data = await api.get<AffectedTradeLanesView>('/trade-lanes/affected', {
        companyId: nextCompanyId,
      });
      if (!data.lanes.length) {
        onConfirm(nextCompanyId);
        return;
      }
      setCompanyId(nextCompanyId);
      setLanes(data.lanes);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Could not check Direct links.', 'danger');
    } finally {
      setChecking(false);
    }
  };

  const sheet = (
    <Sheet
      open={Boolean(companyId)}
      onClose={() => {
        setCompanyId(null);
        setLanes([]);
      }}
      title="Remove Direct link?"
      footer={
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            fullWidth
            variant="secondary"
            onClick={() => {
              setCompanyId(null);
              setLanes([]);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            fullWidth
            data-testid="direct-link-revoke-continue"
            disabled={pending}
            loading={pending}
            onClick={() => {
              const id = companyId;
              setCompanyId(null);
              setLanes([]);
              if (id) onConfirm(id);
            }}
          >
            Continue
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-2 pb-4">
        <DirectLinkRevokeCopy />
        <p className="text-xs text-muted">
          {lanes.map((lane) => `${lane.sellerName} · ${lane.buyerName}`).join(', ')}
        </p>
      </div>
    </Sheet>
  );

  return { sheet, maybeConfirm, checking };
}
