import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import {
  clientAppVersion,
  isNonProductionDeployment,
  shortGitSha,
  testBadgeLabel,
  type ApiVersionIdentity,
} from '@/lib/appVersion';
import { PageHeader } from '@/ui/PageHeader';
import { InlineNotice, LoadingBlock, Tag } from '@/ui/kit';

function IdentityBlock({
  title,
  version,
  buildId,
  gitSha,
  builtAt,
  testId,
}: {
  title: string;
  version: string;
  buildId: string;
  gitSha: string;
  builtAt: string;
  testId: string;
}) {
  return (
    <section className="flex flex-col gap-1.5" data-testid={testId}>
      <h2 className="px-0.5 text-meta font-emphasis tracking-tight text-ink">{title}</h2>
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <Row label="Version" value={version} />
        <Row label="Build" value={buildId} />
        <Row label="Commit" value={`${shortGitSha(gitSha)} (${gitSha})`} />
        <Row label="Built" value={builtAt} />
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line px-3.5 py-3 last:border-b-0">
      <span className="shrink-0 text-sm text-muted">{label}</span>
      <span className="min-w-0 break-all text-right text-sm font-emphasis text-ink">{value}</span>
    </div>
  );
}

export function AboutEkumPage() {
  const app = clientAppVersion();
  const apiVersion = useQuery({
    queryKey: ['api-version'],
    queryFn: () => api.publicGet<ApiVersionIdentity>('/version'),
    staleTime: 60_000,
  });

  return (
    <div className="flex flex-col gap-5" data-testid="about-ekum-page">
      <PageHeader title="About Ekum" />

      {isNonProductionDeployment(app.deployment) ? (
        <div data-testid="about-ekum-test-badge">
          <Tag tone="progress">{testBadgeLabel(app)}</Tag>
        </div>
      ) : null}

      <p className="px-0.5 text-sm text-muted">
        What is running on this phone and on the server. If only one side was rebuilt, the numbers
        can differ.
      </p>

      <IdentityBlock
        title="App"
        testId="about-ekum-app"
        version={app.version}
        buildId={app.buildId}
        gitSha={app.gitSha}
        builtAt={app.builtAt}
      />

      {apiVersion.isLoading ? (
        <LoadingBlock />
      ) : apiVersion.isError ? (
        <InlineNotice message="Could not load API version." />
      ) : apiVersion.data ? (
        <IdentityBlock
          title="API"
          testId="about-ekum-api"
          version={apiVersion.data.version}
          buildId={apiVersion.data.buildId}
          gitSha={apiVersion.data.gitSha}
          builtAt={apiVersion.data.builtAt}
        />
      ) : null}
    </div>
  );
}
