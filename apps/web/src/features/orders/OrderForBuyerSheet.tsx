import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ConnectionView,
  CreateForBuyerDto,
  CreateForBuyerResult,
  TradeLaneView,
} from '@ekum/domain-types';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import { forBuyerPlaceSubsets } from '@/features/browse/packPlacePhases';
import { isTenDigitPhone, orderForBuyerLoggedToast } from '@/features/orders/orderWho';
import { api, ApiError } from '@/lib/apiClient';
import { useMyCompany } from '@/lib/queries';
import { ConnectionPicker } from '@/ui/ConnectionPicker';
import { useToast } from '@/ui/Toast';
import { Button, Field, Sheet, TextInput } from '@/ui/kit';

type Line = { productId: string; quantity: number; companyId?: string };

type Props = {
  open: boolean;
  onClose: () => void;
  lines: Line[];
  productIds: string[];
  transporter?: string;
  collectionId?: string;
  onInvite: (url: string) => void;
  onDone: () => void;
};

function toDtoItems(orderLines: Line[]): CreateForBuyerDto['items'] {
  return orderLines.map((line) => ({
    productId: line.productId,
    quantity: line.quantity,
  }));
}

export function OrderForBuyerSheet({
  open,
  onClose,
  lines,
  productIds,
  transporter,
  collectionId,
  onInvite,
  onDone,
}: Props) {
  const shortlist = useBrowseShortlist();
  const queryClient = useQueryClient();
  const me = useMyCompany();
  const { showToast } = useToast();
  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [offApp, setOffApp] = useState(false);
  const [findMiss, setFindMiss] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');

  const connections = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.get<ConnectionView[]>('/connections'),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    setBuyerId(null);
    setOffApp(false);
    setFindMiss(false);
    setBuyerName('');
    setBuyerPhone('');
  }, [open]);

  const onFindMissChange = useCallback((miss: boolean) => {
    setFindMiss(miss);
  }, []);

  const buyerReady = offApp
    ? buyerName.trim().length > 0 && isTenDigitPhone(buyerPhone)
    : Boolean(buyerId);

  const logForBuyer = useMutation({
    mutationFn: async (orderLines: Line[]) => {
      const shared = {
        ...(transporter?.trim() ? { transporter: transporter.trim() } : {}),
        ...(collectionId ? { collectionId } : {}),
        ...(offApp
          ? { buyerName: buyerName.trim(), buyerPhone: buyerPhone.trim() }
          : { buyerCompanyId: buyerId ?? undefined }),
      };

      const postSubset = (subset: Line[]) =>
        api.post<CreateForBuyerResult>('/orders/for-buyer', {
          ...shared,
          items: toDtoItems(subset),
        } satisfies CreateForBuyerDto);

      if (offApp || !collectionId || !buyerId) {
        return postSubset(orderLines);
      }

      let directMillCompanyIds: string[] = [];
      try {
        const lanes = await api.get<TradeLaneView[]>('/trade-lanes');
        directMillCompanyIds = lanes
          .filter(
            (lane) =>
              lane.buyerCompanyId === buyerId &&
              lane.ticket === 'mill' &&
              lane.behaviors.directOrder !== false,
          )
          .map((lane) => lane.sellerCompanyId);
      } catch {
        return postSubset(orderLines);
      }

      const { direct, handle } = forBuyerPlaceSubsets(orderLines, {
        actorCompanyId: me.data?.id,
        directMillCompanyIds,
      });
      let last: CreateForBuyerResult | null = null;
      if (direct.length > 0) last = await postSubset(direct);
      if (handle.length > 0) last = await postSubset(handle);
      if (!last) return postSubset(orderLines);
      return last;
    },
    onSuccess: (result) => {
      shortlist.removeIds(productIds);
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      if (result.invitePath) {
        onInvite(`${window.location.origin}${result.invitePath}`);
        return;
      }
      showToast(orderForBuyerLoggedToast(result.order.status));
      onDone();
    },
    onError: (err) => {
      showToast(err instanceof ApiError ? err.message : 'Could not log this.', 'danger');
    },
  });

  const busy = logForBuyer.isPending;
  const showOffAppToggle = offApp || findMiss;

  return (
    <Sheet open={open} onClose={onClose} title="Order for buyer">
      <div className="flex flex-col gap-4 pb-1">
        {!offApp ? (
          <ConnectionPicker
            mode="single"
            embedded
            connections={connections.data ?? []}
            loading={connections.isLoading}
            value={buyerId}
            onChange={setBuyerId}
            onFindMissChange={onFindMissChange}
            label="Buyer"
            chooseLabel="Choose buyer"
            emptyMessage="No connections yet — find them on Ekum."
          />
        ) : null}
        {showOffAppToggle ? (
          <button
            type="button"
            data-testid="order-for-buyer-off-app"
            className="self-start text-sm font-emphasis text-accent"
            disabled={busy}
            onClick={() => {
              setOffApp((on) => !on);
              setBuyerId(null);
              setBuyerName('');
              setBuyerPhone('');
              if (offApp) setFindMiss(false);
            }}
          >
            {offApp ? 'Choose a connected buyer' : 'Not on Ekum yet'}
          </button>
        ) : null}
        {offApp ? (
          <>
            <Field label="Name">
              <TextInput
                value={buyerName}
                disabled={busy}
                onChange={(event) => setBuyerName(event.target.value)}
              />
            </Field>
            <Field label="Phone">
              <TextInput
                inputMode="tel"
                value={buyerPhone}
                placeholder="10-digit"
                disabled={busy}
                onChange={(event) => setBuyerPhone(event.target.value)}
              />
            </Field>
          </>
        ) : null}
        <Button
          fullWidth
          disabled={busy || lines.length === 0 || !buyerReady}
          onClick={() => logForBuyer.mutate(lines)}
        >
          {logForBuyer.isPending ? 'Logging…' : 'Log order'}
        </Button>
      </div>
    </Sheet>
  );
}
