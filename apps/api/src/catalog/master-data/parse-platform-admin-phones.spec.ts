import { parsePlatformAdminPhones } from './master-data.service';

describe('parsePlatformAdminPhones', () => {
  it('normalizes valid Indian mobiles and drops duplicates', () => {
    const { phones, invalid } = parsePlatformAdminPhones(
      '9800000001, +919800000001, 09800000001',
    );
    expect(phones).toEqual(['+919800000001']);
    expect(invalid).toEqual([]);
  });

  it('reports invalid entries instead of silent drop', () => {
    const { phones, invalid } = parsePlatformAdminPhones(
      'not-a-phone, +919800000002, abc',
    );
    expect(phones).toEqual(['+919800000002']);
    expect(invalid).toEqual(['not-a-phone', 'abc']);
  });

  it('returns empty lists for blank config', () => {
    expect(parsePlatformAdminPhones('  ,  ')).toEqual({ phones: [], invalid: [] });
  });
});
