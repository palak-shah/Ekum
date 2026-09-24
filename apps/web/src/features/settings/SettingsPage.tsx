import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AddressView,
  BillingFirmView,
  UpsertAddressDto,
  UpsertBillingFirmDto,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { PageHeader } from '@/ui/PageHeader';
import {
  Button,
  Field,
  InlineNotice,
  LoadingBlock,
  Sheet,
  Tag,
  TextInput,
} from '@/ui/kit';
import { SuggestInput } from '@/ui/SuggestInput';
import { useTradePresence } from '@/lib/tradePresence';
import { SettingsDomainCard, SettingsDomainGroup } from '@/features/settings/SettingsDomainCard';
import { settingsBusinessRoleLinks } from '@/features/settings/youShortcuts';

const emptyAddress = (): UpsertAddressDto => ({
  label: '',
  line1: '',
  city: '',
  isDefault: false,
});

const emptyFirm = (): UpsertBillingFirmDto => ({
  name: '',
  gstNumber: '',
  addressLine: '',
  isDefault: false,
});

export function SettingsPage() {
  const { trading, selling } = useTradePresence();
  const queryClient = useQueryClient();
  const [addrOpen, setAddrOpen] = useState(false);
  const [firmOpen, setFirmOpen] = useState(false);
  const [addr, setAddr] = useState<UpsertAddressDto>(emptyAddress());
  const [firm, setFirm] = useState<UpsertBillingFirmDto>(emptyFirm());
  const [firmError, setFirmError] = useState<string | null>(null);

  const addresses = useQuery({
    queryKey: ['addresses'],
    queryFn: () => api.get<AddressView[]>('/settings/addresses'),
  });
  const billingFirms = useQuery({
    queryKey: ['billing-firms'],
    queryFn: () => api.get<BillingFirmView[]>('/settings/billing-firms'),
  });

  const createAddress = useMutation({
    mutationFn: () => api.post('/settings/addresses', addr),
    onSuccess: () => {
      setAddrOpen(false);
      setAddr(emptyAddress());
      void queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  const createFirm = useMutation({
    mutationFn: (dto: UpsertBillingFirmDto) => api.post('/settings/billing-firms', dto),
    onSuccess: () => {
      setFirmOpen(false);
      setFirm(emptyFirm());
      setFirmError(null);
      void queryClient.invalidateQueries({ queryKey: ['billing-firms'] });
    },
    onError: (err) => {
      setFirmError(err instanceof ApiError ? err.message : 'Could not save billing firm.');
    },
  });

  const openAddFirm = () => {
    setFirmError(null);
    setFirm({
      ...emptyFirm(),
      isDefault: (billingFirms.data?.length ?? 0) === 0,
    });
    setFirmOpen(true);
  };

  const saveFirm = () => {
    setFirmError(null);
    createFirm.mutate({
      name: firm.name.trim(),
      gstNumber: firm.gstNumber?.trim() || undefined,
      addressLine: firm.addressLine?.trim() || undefined,
      isDefault: firm.isDefault,
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Settings" />

      <SettingsDomainGroup title="Business & Roles" testId="settings-domain-business-roles">
        {settingsBusinessRoleLinks(trading, selling).map((item) => (
          <SettingsDomainCard key={item.to} to={item.to} title={item.title} hint={item.hint} />
        ))}
      </SettingsDomainGroup>

      <section className="flex flex-col gap-1.5" data-testid="settings-domain-dispatch">
        <div className="flex items-center justify-between gap-3 px-0.5">
          <h2 className="text-[13px] font-semibold tracking-tight text-ink">Dispatch</h2>
          <button className="text-xs font-medium text-accent" onClick={() => setAddrOpen(true)}>
            Add
          </button>
        </div>
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          {addresses.isLoading ? (
            <div className="px-3.5 py-3">
              <LoadingBlock />
            </div>
          ) : addresses.data && addresses.data.length > 0 ? (
            addresses.data.map((address) => (
              <div
                key={address.id}
                className="flex items-start justify-between gap-3 border-b border-line px-3.5 py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{address.label}</p>
                  <p className="text-xs text-muted">
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ''}, {address.city}
                    {address.pincode ? ` · ${address.pincode}` : ''}
                  </p>
                </div>
                {address.isDefault ? <Tag tone="success">Default</Tag> : null}
              </div>
            ))
          ) : (
            <p className="px-3.5 py-3 text-sm text-muted">Add a dispatch address for orders.</p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-1.5" data-testid="settings-domain-billing">
        <div className="flex items-center justify-between gap-3 px-0.5">
          <h2 className="text-[13px] font-semibold tracking-tight text-ink">Billing</h2>
          <button
            type="button"
            data-testid="settings-add-billing-firm"
            className="text-xs font-medium text-accent"
            onClick={openAddFirm}
          >
            Add
          </button>
        </div>
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          {billingFirms.isLoading ? (
            <div className="px-3.5 py-3">
              <LoadingBlock />
            </div>
          ) : billingFirms.data && billingFirms.data.length > 0 ? (
            billingFirms.data.map((row) => (
              <div
                key={row.id}
                className="flex items-start justify-between gap-3 border-b border-line px-3.5 py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{row.name}</p>
                  {row.gstNumber ? <p className="text-xs text-muted">GST · {row.gstNumber}</p> : null}
                  {row.addressLine ? <p className="text-xs text-muted">{row.addressLine}</p> : null}
                </div>
                {row.isDefault ? <Tag tone="success">Default</Tag> : null}
              </div>
            ))
          ) : (
            <p className="px-3.5 py-3 text-sm text-muted">Add the GST firm you invoice under.</p>
          )}
        </div>
      </section>

      <Sheet open={addrOpen} onClose={() => setAddrOpen(false)} title="New address">
        <div className="flex flex-col gap-3">
          <Field label="Label">
            <TextInput value={addr.label} onChange={(e) => setAddr({ ...addr, label: e.target.value })} placeholder="Warehouse" />
          </Field>
          <Field label="Address line">
            <TextInput value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="City">
              <SuggestInput
                kind="city"
                value={addr.city}
                onChange={(city) => setAddr({ ...addr, city })}
              />
            </Field>
            <Field label="Pincode">
              <TextInput value={addr.pincode ?? ''} onChange={(e) => setAddr({ ...addr, pincode: e.target.value })} />
            </Field>
          </div>
          <Button
            fullWidth
            disabled={!addr.label.trim() || !addr.line1.trim() || !addr.city.trim() || createAddress.isPending}
            onClick={() => createAddress.mutate()}
          >
            Save address
          </Button>
        </div>
      </Sheet>

      <Sheet open={firmOpen} onClose={() => setFirmOpen(false)} title="New billing firm">
        <div className="flex flex-col gap-3">
          {firmError ? <InlineNotice message={firmError} /> : null}
          <Field label="Firm name">
            <TextInput
              data-testid="billing-firm-name"
              value={firm.name}
              onChange={(e) => setFirm({ ...firm, name: e.target.value })}
              placeholder="Business legal name"
            />
          </Field>
          <Field label="GST number">
            <TextInput
              data-testid="billing-firm-gst"
              value={firm.gstNumber ?? ''}
              onChange={(e) => setFirm({ ...firm, gstNumber: e.target.value })}
              placeholder="Optional"
            />
          </Field>
          <Field label="Billing address">
            <TextInput
              value={firm.addressLine ?? ''}
              onChange={(e) => setFirm({ ...firm, addressLine: e.target.value })}
              placeholder="Optional"
            />
          </Field>
          <Button
            fullWidth
            data-testid="billing-firm-save"
            disabled={!firm.name.trim() || createFirm.isPending}
            onClick={saveFirm}
          >
            {createFirm.isPending ? 'Saving…' : 'Save firm'}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
