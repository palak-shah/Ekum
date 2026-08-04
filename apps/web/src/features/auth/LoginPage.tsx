import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuthSession } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { BrandMark } from '@/ui/BrandMark';
import { Button, Field, TextInput } from '@/ui/kit';

interface OtpIssueResult {
  expiresInSeconds: number;
  devCode?: string;
}

/**
 * Mobile login: logo is the hero, then one job (phone → OTP).
 */
export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const requestOtp = async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await api.publicPost<OtpIssueResult>('/auth/otp/request', { phone });
      setDevCode(result.devCode ?? null);
      setStep('code');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send the code.');
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    setError(null);
    setBusy(true);
    try {
      const session = await api.publicPost<AuthSession>('/auth/otp/verify', { phone, code });
      login(session);
      navigate(session.needsOnboarding ? '/onboarding' : '/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'That code did not work.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col bg-canvas px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(3rem,env(safe-area-inset-top))]">
      <div className="ekum-rise flex flex-1 flex-col justify-center">
        <div className="mb-14 flex justify-center">
          <BrandMark size="login" />
        </div>

        {step === 'phone' ? (
          <form
            className="flex flex-col gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              void requestOtp();
            }}
          >
            <Field label="Mobile number" error={error}>
              <TextInput
                type="tel"
                inputMode="numeric"
                autoFocus
                autoComplete="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </Field>
            <Button type="submit" fullWidth disabled={busy || phone.trim().length < 10}>
              {busy ? 'Sending…' : 'Continue'}
            </Button>
          </form>
        ) : (
          <form
            className="flex flex-col gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              void verifyOtp();
            }}
          >
            <Field
              label="One-time code"
              hint={devCode ? `Dev code: ${devCode}` : `Sent to ${phone}`}
              error={error}
            >
              <TextInput
                inputMode="numeric"
                autoFocus
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="6-digit code"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
              />
            </Field>
            <Button type="submit" fullWidth disabled={busy || code.length !== 6}>
              {busy ? 'Verifying…' : 'Continue'}
            </Button>
            <button
              type="button"
              className="text-center text-sm font-bold text-accent"
              onClick={() => {
                setStep('phone');
                setCode('');
                setError(null);
              }}
            >
              Use a different number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
