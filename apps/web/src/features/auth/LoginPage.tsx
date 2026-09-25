import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import type { AuthSession } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { resolveInviteReturn } from '@/lib/inviteReturn';
import { BrandMark } from '@/ui/BrandMark';
import { Button, Field, TextInput } from '@/ui/kit';

interface OtpIssueResult {
  expiresInSeconds: number;
  devCode?: string;
}

/** Horizontal wash sampled from `logo-primary.png` (left #1b8481 → right #01a7bc). */
const LOGIN_PANEL =
  'flex w-full flex-col gap-6 rounded-2xl bg-gradient-to-r from-[#1b8481] to-[#01a7bc] px-5 pb-5 pt-7 [&_label>span.text-ink]:text-white [&_.text-muted]:text-white/80';

const FORM_STACK = 'flex flex-col gap-4';

/**
 * Mobile login: logo + OTP sit on one horizontal box filled with the
 * same teal gradient as the badge.
 * Invite deep links (`state.from` / `?invite=`) survive OTP and onboarding.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fromState = (location.state as { from?: string } | null)?.from ?? null;
  const inviteReturn = useMemo(
    () =>
      resolveInviteReturn({
        from: fromState,
        inviteParam: searchParams.get('invite'),
      }),
    [fromState, searchParams],
  );

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
      if (session.needsOnboarding) {
        if (inviteReturn?.startsWith('/t/')) {
          navigate(inviteReturn, { replace: true });
        } else {
          navigate('/onboarding', {
            replace: true,
            state: inviteReturn ? { from: inviteReturn } : undefined,
          });
        }
      } else {
        navigate(inviteReturn ?? '/', { replace: true });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'That code did not work.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col bg-canvas px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(3rem,env(safe-area-inset-top))]">
      <div className="flex flex-1 flex-col justify-center">
        <div className={LOGIN_PANEL}>
        <div className="-mt-1 flex flex-col items-center gap-2">
          <BrandMark size="login" />
          <p className="text-center text-sm font-medium tracking-tight text-white/90">
            Textile trade, organised.
          </p>
        </div>

        {inviteReturn ? (
          <div className="rounded-xl bg-white/15 px-3.5 py-3 text-center text-sm text-white">
            {inviteReturn.startsWith('/s/')
              ? 'Sign in to open this on Ekum.'
              : inviteReturn.startsWith('/t/')
                ? "You've been invited to join a team — sign in to continue."
                : "You've been invited — sign in to connect."}
          </div>
        ) : null}

        {step === 'phone' ? (
          <form
            className={FORM_STACK}
            onSubmit={(event) => {
              event.preventDefault();
              void requestOtp();
            }}
          >
            <Field label="Mobile number" error={error}>
              <TextInput
                type="tel"
                inputMode="tel"
                name="tel"
                autoComplete="tel"
                enterKeyHint="done"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </Field>
            <Button
              type="submit"
              variant="secondary"
              fullWidth
              disabled={busy || phone.trim().length < 10}
            >
              {busy ? 'Sending…' : 'Continue'}
            </Button>
          </form>
        ) : (
          <form
            className={FORM_STACK}
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
            <Button
              type="submit"
              variant="secondary"
              fullWidth
              disabled={busy || code.length !== 6}
            >
              {busy ? 'Verifying…' : 'Continue'}
            </Button>
            <button
              type="button"
              className="text-center text-sm font-bold text-white"
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
    </div>
  );
}
