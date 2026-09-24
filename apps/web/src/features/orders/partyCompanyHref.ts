/** Profile path for a Parties name. Your own shop stays plain text. */
export function partyCompanyHref(you: boolean, companyId: string | undefined): string | null {
  if (you) return null;
  const id = companyId?.trim();
  if (!id) return null;
  return `/company/${id}`;
}
