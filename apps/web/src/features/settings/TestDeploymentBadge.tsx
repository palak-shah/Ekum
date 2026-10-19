import {
  clientAppVersion,
  isNonProductionDeployment,
  testBadgeLabel,
} from '@/lib/appVersion';
import { Tag } from '@/ui/kit';

/** Quiet fixed chip — non-production only. Does not compete with New version · Load. */
export function TestDeploymentBadge() {
  const app = clientAppVersion();
  if (!isNonProductionDeployment(app.deployment)) return null;

  return (
    <div
      data-testid="ekum-test-badge"
      className="pointer-events-none fixed inset-x-0 top-[max(0.35rem,env(safe-area-inset-top))] z-[90] mx-auto flex w-full max-w-md justify-start px-3"
      aria-hidden
    >
      <span className="opacity-70">
        <Tag tone="muted">{testBadgeLabel(app)}</Tag>
      </span>
    </div>
  );
}
