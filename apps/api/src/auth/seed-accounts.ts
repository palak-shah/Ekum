/** Demo seed people — last 10 digits always open these accounts, not leftovers. */
export const SEED_USER_BY_LAST10: Record<string, string> = {
  '9800000001': 'seed-user-ravi',
  '9800000002': 'seed-user-meena',
  '9800000003': 'seed-user-kavita',
  '9800000004': 'seed-user-ravi-staff',
};

export const SEED_COMPANY_BY_USER_ID: Record<string, string> = {
  'seed-user-ravi': 'seed-company-ravi',
  'seed-user-meena': 'seed-company-meena',
  'seed-user-kavita': 'seed-company-kavita',
  'seed-user-ravi-staff': 'seed-company-ravi',
};

export function last10Digits(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10);
}

export function seedUserIdForPhone(phone: string): string | undefined {
  return SEED_USER_BY_LAST10[last10Digits(phone)];
}

/** Leftover JWTs for a demo number still act as the seed person. */
export function actingUserId(phone: string, tokenSub: string): string {
  return seedUserIdForPhone(phone) ?? tokenSub;
}

export function preferredSeedCompanyId(userId: string): string | undefined {
  return SEED_COMPANY_BY_USER_ID[userId];
}
