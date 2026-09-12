import path from 'node:path';

/** Real JPEG fixture under `apps/e2e/fixtures` (Playwright cwd). */
export const SAMPLE_JPG = path.join(process.cwd(), 'fixtures/sample.jpg');

/** Same bytes, three paths — multi-file pickers need distinct File entries. */
export function sampleJpgTimes(n: number): string[] {
  return Array.from({ length: n }, () => SAMPLE_JPG);
}
