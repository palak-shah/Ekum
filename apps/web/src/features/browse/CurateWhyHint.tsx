import { InfoHint } from '@/ui/kit';
import { curateWhyHintLines } from '@/features/browse/curateCheck';

/** Skip / publish why — same quiet i as Apply-all. */
export function CurateWhyHint({
  codes,
  extra,
  testId = 'repost-skip-info',
}: {
  codes: string[];
  extra?: string | null;
  testId?: string;
}) {
  const lines = curateWhyHintLines(codes, extra);
  if (lines.length === 0) return null;
  return (
    <InfoHint
      label={codes.length > 0 ? 'Why these were skipped' : 'Why this didn’t publish'}
      testId={testId}
    >
      <span className="flex flex-col gap-1.5">
        {lines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </span>
    </InfoHint>
  );
}
