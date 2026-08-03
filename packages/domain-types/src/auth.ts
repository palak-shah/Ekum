import { z } from 'zod';

/** Ekum authenticates a phone number (OTP), then binds it to a company. */
export const phoneNumberSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9]{10,15}$/, 'Enter a valid mobile number');

export const requestOtpSchema = z.object({
  phone: phoneNumberSchema,
});
export type RequestOtpDto = z.infer<typeof requestOtpSchema>;

export const verifyOtpSchema = z.object({
  phone: phoneNumberSchema,
  code: z
    .string()
    .trim()
    .regex(/^[0-9]{6}$/, 'Enter the 6-digit code sent to your phone'),
});
export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type AuthTokens = z.infer<typeof authTokensSchema>;

/** The authenticated principal: a phone-verified user acting as a company. */
export const sessionUserSchema = z.object({
  userId: z.string(),
  phone: z.string(),
  companyId: z.string().nullable(),
});
export type SessionUser = z.infer<typeof sessionUserSchema>;

/** The result of a successful login. `needsOnboarding` is true until a company exists. */
export interface AuthSession {
  tokens: AuthTokens;
  user: SessionUser;
  needsOnboarding: boolean;
}
