import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';
import { Button, ErrorState } from '@/ui/kit';
import { routeErrorMessage } from './routeErrorMessage';

function RouteErrorView({ message, showRetry }: { message: string; showRetry: boolean }) {
  const navigate = useNavigate();
  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col bg-canvas px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
      <p className="text-xs font-semibold text-accent">Ekum</p>
      <div className="flex flex-1 flex-col justify-center gap-4 py-8">
        <ErrorState message={message} />
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
  const message = routeErrorMessage(error);
  const is404 = isRouteErrorResponse(error) && error.status === 404;
  return <RouteErrorView message={message} showRetry={!is404} />;
}
