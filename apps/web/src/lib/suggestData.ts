/** Curated textile hubs — used when the live search facet is empty or unavailable. */
export const SUGGEST_CITIES = [
  'Surat',
  'Mumbai',
  'Ahmedabad',
  'Delhi',
  'Noida',
  'Gurugram',
  'Jaipur',
  'Tiruppur',
  'Erode',
  'Coimbatore',
  'Bengaluru',
  'Chennai',
  'Hyderabad',
  'Kolkata',
  'Ludhiana',
  'Amritsar',
  'Indore',
  'Bhiwandi',
  'Ichalkaranji',
  'Panipat',
  'Karur',
  'Salem',
  'Madurai',
  'Nagpur',
  'Pune',
  'Vadodara',
  'Rajkot',
  'Bhilwara',
  'Kanpur',
  'Varanasi',
] as const;

/** Common fine categories in Indian B2B textile trade. */
export const SUGGEST_CATEGORIES = [
  'sarees',
  'kurtis',
  'lehenga',
  'dress materials',
  'suits',
  'salwar suits',
  'party wear',
  'ethnic wear',
  'western wear',
  'kids wear',
  'mens shirts',
  't-shirts',
  'jeans',
  'trousers',
  'formals',
  'casuals',
  'nightwear',
  'innerwear',
  'dupatta',
  'blouse',
  'fabrics',
  'cotton',
  'silk',
  'linen',
  'georgette',
  'chiffon',
  'home furnishing',
  'bedsheets',
  'curtains',
  'towels',
  'accessories',
  'scarves',
  'stoles',
] as const;

export function filterSuggestions(
  pool: readonly string[],
  needle: string,
  limit = 8,
): string[] {
  const q = needle.trim().toLowerCase();
  if (!q) return [...pool].slice(0, limit);
  const starts: string[] = [];
  const contains: string[] = [];
  for (const item of pool) {
    const lower = item.toLowerCase();
    if (lower === q) continue;
    if (lower.startsWith(q)) starts.push(item);
    else if (lower.includes(q)) contains.push(item);
  }
  return [...starts, ...contains].slice(0, limit);
}

/** Current comma-list token (text after the last comma). */
export function listToken(value: string): { prefix: string; token: string } {
  const lastComma = value.lastIndexOf(',');
  if (lastComma < 0) return { prefix: '', token: value };
  return {
    prefix: value.slice(0, lastComma + 1),
    token: value.slice(lastComma + 1).replace(/^\s*/, ''),
  };
}

export function applyListSuggestion(value: string, suggestion: string): string {
  const { prefix } = listToken(value);
  if (!prefix) return `${suggestion}, `;
  return `${prefix.replace(/\s*$/, '')} ${suggestion}, `;
}
