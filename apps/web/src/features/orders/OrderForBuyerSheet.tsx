import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ConnectionView, CreateForBuyerDto, CreateForBuyerResult } from '@ekum/domain-types';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import { isTenDigitPhone } from '@/features/orders/orderWho';
import { api, ApiError } from '@/lib/apiClient';
import { ConnectionPicker } from '@/ui/ConnectionPicker';
import { useToast } from '@/ui/Toast';
import { Button, Field, Sheet, TextInput } from '@/ui/kit';

type Line = { productId: string; quantity: number };

type Props = {
  open: boolean;
  onClose: () => void;
  lines: Line[];
  productIds: string[];
  onInvite: (url: string) => void;
  onDone: () => void;
};

export function OrderForBuyerSheet({ open, onClose, lines, productIds, onInvite, onDone }: Props) {
  const shortlist = useBrowseShortlist();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [offApp, setOffApp] = useState(false);
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
    setBuyerName('');
    setBuyerPhone('');
  }, [open]);

  const buyerReady = offApp
    ? buyerName.trim().length > 0 && isTenDigitPhone(buyerPhone)
    : Boolean(buyerId);

  const logForBuyer = useMutation({
    mutationFn: (orderLines: Line[]) => {
      const dto: CreateForBuyerDto = {
        items: orderLines,
        ...(offApp
          ? { buyerName: buyerName.trim(), buyerPhone: buyerPhone.trim() }
          : { buyerCompanyId: buyerId ?? undefined }),
      };
      return api.post<CreateForBuyerResult>('/orders/for-buyer', dto);
    },
    onSuccess: (result) => {
      shortlist.removeIds(productIds);
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      if (result.invitePath) {
        onInvite(`${window.location.origin}${result.invitePath}`);
        return;
      }
      showToast('Logged. They can Accept.');
      onDone();
    },
    onError: (err) => {
      showToast(err instanceof ApiError ? err.message : 'Could not log this.', 'danger');
    },
  });

  const busy = logForBuyer.isPending;

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
            label="Buyer"
            chooseLabel="Choose buyer"
            emptyMessage="No connections yet — use name and phone."
          />
        ) : null}
        <button
          type="button"
          className="self-start text-sm font-bold text-accent"
          disabled={busy}
          onClick={() => {
            setOffApp((on) => !on);
            setBuyerId(null);
            setBuyerName('');
            setBuyerPhone('');
          }}
        >
          {offApp ? 'Choose a connected buyer' : 'Not on Ekum yet'}
        </button>
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
