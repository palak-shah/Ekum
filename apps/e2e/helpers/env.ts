export const WEB_URL = process.env.EKUM_WEB_URL ?? 'http://127.0.0.1:5173';
/** Matches API global prefix + web default `VITE_API_BASE_URL`. */
export const API_URL = process.env.EKUM_API_URL ?? 'http://127.0.0.1:3000/api/v1';

export const PHONES = {
  ravi: '+919800000001',
  meena: '+919800000002',
} as const;
