import { describe, expect, it } from 'vitest';
import { voiceProgressRatio } from './voiceProgress';

describe('voiceProgressRatio', () => {
  it('stays empty when duration is missing', () => {
    expect(voiceProgressRatio(800, null)).toBe(0);
    expect(voiceProgressRatio(800, 0)).toBe(0);
  });

  it('caps at the end of the clip', () => {
    expect(voiceProgressRatio(2500, 5000)).toBe(0.5);
    expect(voiceProgressRatio(9000, 5000)).toBe(1);
  });
});
