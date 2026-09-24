import type { ConnectionView, PublicCompanyProfile } from '@ekum/domain-types';

/** So Photo order from a 1:1 still shows that shop if they are not in Connections. */
export function withPrefillSeller(
  sellers: ConnectionView[],
  prefill: PublicCompanyProfile | undefined,
): ConnectionView[] {
  if (!prefill) return sellers;
  if (sellers.some((row) => row.company.id === prefill.id)) return sellers;
  return [
    {
      id: `prefill:${prefill.id}`,
      company: {
        id: prefill.id,
        name: prefill.name,
        city: prefill.city,
        verification: prefill.verification,
        logoUrl: prefill.logoUrl,
      },
      status: 'active',
      createdAt: '',
      canPause: false,
      canResume: false,
      canBlock: false,
      canUnblock: false,
    },
    ...sellers,
  ];
}
