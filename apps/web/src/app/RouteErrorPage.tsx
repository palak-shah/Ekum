import { useState } from 'react';
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';
import { Button, ErrorState, Field, TextArea } from '@/ui/kit';
import { routeErrorDetail, routeErrorMessage } from './routeErrorMessage';

function RouteErrorView({
  message,
  showRetry,
  detail,
}: {
  message: string;
  showRetry: boolean;
  detail?: string | null;
}) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const copyDetail = async () => {
    if (!detail) return;
    try {
      await navigator.clipboard.writeText(detail);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col bg-canvas px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
      <p className="text-xs font-semibold text-accent">Ekum</p>
      <div className="flex flex-1 flex-col justify-center gap-4 py-8">
        <ErrorState message={message} />
        {detail ? (
          <Field label="What broke" hint="Copy this if you need help. Nothing is sent by itself.">
            <TextArea
              readOnly
              value={detail}
              rows={Math.min(6, detail.split('\n').length + 1)}
              data-testid="route-error-detail"
              className="font-mono text-xs"
            />
          </Field>
        ) : null}
        {detail ? (
          <Button variant="ghost" fullWidth onClick={() => void copyDetail()}>
            {copied ? 'Copied' : 'Copy error'}
          </Button>
        ) : null}
        <Button fullWidth onClick={() => navigate('/', { replace: true })}>
          Go home
        </Button>
        {showRetry ? (
          <Button variant="secondary" fullWidth onClick={() => window.location.reload()}>
            Try again
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/** Unknown URL — used as a splat route element (not an error boundary). */
export function NotFoundPage() {
  return <RouteErrorView message="This page isn't available." showRetry={false} />;
}

/** Replaces React Router’s default “Unexpected Application Error!” dump. */
export function RouteErrorPage() {
  const error = useRouteError();
  if (typeof console !== 'undefined') {
    console.error('[ekum] page crash', error);
  }
  const message = routeErrorMessage(error);
  const detail = routeErrorDetail(error);
  const is404 = isRouteErrorResponse(error) && error.status === 404;
  return <RouteErrorView message={message} detail={is404 ? null : detail} showRetry={!is404} />;
}
