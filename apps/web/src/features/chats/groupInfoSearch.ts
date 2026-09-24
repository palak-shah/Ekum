import type { ParticipantView } from '@ekum/domain-types';

export function groupCompaniesOnChat(participants: ParticipantView[]): ParticipantView[] {
  return participants.filter(
    (row) => (row.state === 'active' || row.state === 'pending') && !row.companyId.startsWith('__'),
  );
}

export function filterGroupCompanies(
  participants: ParticipantView[],
  query: string,
): ParticipantView[] {
  const needle = query.trim().toLowerCase();
  const rows = groupCompaniesOnChat(participants);
  if (!needle) return rows;
  return rows.filter((row) => {
    const name = row.company.name.toLowerCase();
    const city = (row.company.city ?? '').toLowerCase();
    return name.includes(needle) || city.includes(needle);
  });
}
