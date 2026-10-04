import { describe, expect, it } from 'vitest';
import { isChatSystemNotice } from './chatSystemNotice';

describe('isChatSystemNotice', () => {
  it('treats leave lines as centered notices', () => {
    expect(
      isChatSystemNotice({
        type: 'system',
        body: 'Priya left',
        metadata: { kind: 'member_left' },
      } as never),
    ).toBe(true);
    expect(
      isChatSystemNotice({
        type: 'system',
        metadata: { kind: 'company_left', companyId: 'c1' },
      }),
    ).toBe(true);
  });

  it('keeps company-side and order/ask system cards out', () => {
    expect(
      isChatSystemNotice({
        type: 'system',
        metadata: { side: 'company', companyId: 'c1' },
      }),
    ).toBe(false);
    expect(
      isChatSystemNotice({
        type: 'system',
        referenceId: 'o1',
        metadata: { kind: 'order_lines' },
      }),
    ).toBe(false);
  });
});
