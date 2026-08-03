import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AddressView, BillingFirmView, UpsertAddressDto } from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { PageHeader } from '@/ui/PageHeader';
import { Button, Card, EmptyState, Field, LoadingBlock, SectionHeader, Sheet, Tag, TextInput } from '@/ui/kit';

export function SettingsPage() {
  const queryClient = useQueryClient();
  const [addrOpen, setAddrOpen] = useState(false);
  const [addr, setAddr] = useState<UpsertAddressDto>({ label: '', line1: '', city: '', isDefault: false });

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
      setAddr({ label: '', line1: '', city: '', isDefault: false });
      void queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" />

      <section className="flex flex-col gap-2">
        <SectionHeader
          title="Dispatch addresses"
          action={
            <button className="text-xs font-medium text-accent" onClick={() => setAddrOpen(true)}>
              Add
            </button>
          }
        />
        {addresses.isLoading ? (
          <LoadingBlock />
        ) : addresses.data && addresses.data.length > 0 ? (
          addresses.data.map((address) => (
            <Card key={address.id} className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">{address.label}</p>
                <p className="text-xs text-muted">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ''}, {address.city}
                  {address.pincode ? ` · ${address.pincode}` : ''}
                </p>
              </div>
              {address.isDefault ? <Tag tone="success">Default</Tag> : null}
            </Card>
          ))
        ) : (
          <EmptyState title="No addresses" message="Add a dispatch address for orders." />
        )}
      </section>

      <section className="flex flex-col gap-2">
        <SectionHeader title="Billing firms" />
        {billingFirms.isLoading ? (
          <LoadingBlock />
        ) : billingFirms.data && billingFirms.data.length > 0 ? (
          billingFirms.data.map((firm) => (
            <Card key={firm.id} className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">{firm.name}</p>
                {firm.gstNumber ? <p className="text-xs text-muted">GST · {firm.gstNumber}</p> : null}
              </div>
              {firm.isDefault ? <Tag tone="success">Default</Tag> : null}
            </Card>
          ))
        ) : (
          <EmptyState title="No billing firms" message="Add the GST firm you invoice under." />
        )}
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
              <TextInput value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} />
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
    </div>
  );
}
