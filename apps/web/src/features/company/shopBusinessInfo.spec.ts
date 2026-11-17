import { describe, expect, it } from 'vitest';
import {
  formatShopAddress,
  formatShopClock12ToHhmm,
  formatShopTime12,
  isShopOpenNow,
  normalizeWebsiteUrl,
  parseShopHhmmToClock12,
  shopHoursAreSameDay,
  shopHoursCaption,
  shopMapsSearchUrl,
  shopWeekHoursLines,
  snapShopMinute,
  websiteDisplayHost,
  type ShopWorkingHours,
} from '@ekum/domain-types';

const hours: ShopWorkingHours = {
  opensAt: '10:30',
  closesAt: '19:30',
  weeklyOff: 'sun',
};

/** Monday 16 Nov 2026 10:30 IST. */
const mondayOpen = new Date('2026-11-16T05:00:00.000Z');
/** Monday 19:29 IST. */
const mondayBeforeClose = new Date('2026-11-16T13:59:00.000Z');
/** Monday 19:30 IST — closed. */
const mondayClose = new Date('2026-11-16T14:00:00.000Z');
/** Monday 09:00 IST. */
const mondayBeforeOpen = new Date('2026-11-16T03:30:00.000Z');
/** Sunday 12:00 IST. */
const sundayNoon = new Date('2026-11-15T06:30:00.000Z');

describe('shop hours', () => {
  it('rejects closing at or before opening', () => {
    expect(shopHoursAreSameDay('10:30', '19:30')).toBe(true);
    expect(shopHoursAreSameDay('19:30', '10:30')).toBe(false);
    expect(shopHoursAreSameDay('10:30', '10:30')).toBe(false);
  });

  it('formats 12-hour times', () => {
    expect(formatShopTime12('10:30')).toBe('10:30 AM');
    expect(formatShopTime12('19:30')).toBe('7:30 PM');
  });

  it('round-trips 12h+AM/PM clock parts to HH:mm', () => {
    expect(parseShopHhmmToClock12('10:00')).toEqual({
      hour12: 10,
      minute: 0,
      meridiem: 'AM',
    });
    expect(parseShopHhmmToClock12('19:00')).toEqual({
      hour12: 7,
      minute: 0,
      meridiem: 'PM',
    });
    expect(formatShopClock12ToHhmm({ hour12: 10, minute: 0, meridiem: 'AM' })).toBe(
      '10:00',
    );
    expect(formatShopClock12ToHhmm({ hour12: 7, minute: 0, meridiem: 'PM' })).toBe(
      '19:00',
    );
    expect(formatShopClock12ToHhmm({ hour12: 12, minute: 0, meridiem: 'AM' })).toBe(
      '00:00',
    );
    expect(formatShopClock12ToHhmm({ hour12: 12, minute: 15, meridiem: 'PM' })).toBe(
      '12:15',
    );
    expect(snapShopMinute(20)).toBe(15);
    expect(snapShopMinute(23)).toBe(30);
  });

  it('is open at opening and one minute before close, closed at closing', () => {
    expect(isShopOpenNow(hours, mondayOpen)).toBe(true);
    expect(isShopOpenNow(hours, mondayBeforeClose)).toBe(true);
    expect(isShopOpenNow(hours, mondayClose)).toBe(false);
    expect(shopHoursCaption(hours, mondayOpen)).toBe(
      'Open now · 10:30 AM – 7:30 PM · Sunday off',
    );
    expect(shopHoursCaption(hours, mondayClose)).toBe(
      'Closed now · Opens at 10:30 AM tomorrow',
    );
  });

  it('is closed on the weekly off and opens the next working day', () => {
    expect(isShopOpenNow(hours, sundayNoon)).toBe(false);
    expect(shopHoursCaption(hours, sundayNoon)).toBe(
      'Closed now · Opens at 10:30 AM tomorrow',
    );
  });

  it('opens later today when still before opening', () => {
    expect(shopHoursCaption(hours, mondayBeforeOpen)).toBe(
      'Closed now · Opens at 10:30 AM',
    );
  });

  it('omits weekly-off copy when there is no weekly off', () => {
    expect(
      shopHoursCaption({ ...hours, weeklyOff: null }, mondayOpen),
    ).toBe('Open now · 10:30 AM – 7:30 PM');
  });

  it('lists each weekday in the hours sheet', () => {
    const lines = shopWeekHoursLines(hours);
    expect(lines[0]?.line).toBe('Monday · 10:30 AM – 7:30 PM');
    expect(lines[6]?.line).toBe('Sunday · Off');
  });
});

describe('shop address and website', () => {
  it('formats address and a Google Maps search URL', () => {
    const line = formatShopAddress(
      {
        unit: 'Shop 12',
        street: 'Ring Road',
        area: 'Textile Market',
        pincode: '395002',
      },
      'Surat',
    );
    expect(line).toBe('Shop 12, Ring Road, Textile Market, 395002, Surat');
    expect(shopMapsSearchUrl(line!)).toBe(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(line!)}`,
    );
  });

  it('hides address when only city exists', () => {
    expect(
      formatShopAddress(
        { unit: null, street: null, area: null, pincode: null },
        'Surat',
      ),
    ).toBeNull();
  });

  it('normalizes websites and rejects unsafe schemes', () => {
    expect(normalizeWebsiteUrl('suratsilk.example')).toBe(
      'https://suratsilk.example/',
    );
    expect(normalizeWebsiteUrl('https://www.suratsilk.example/about')).toBe(
      'https://www.suratsilk.example/about',
    );
    expect(normalizeWebsiteUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeWebsiteUrl('data:text/html,hi')).toBeNull();
    expect(websiteDisplayHost('https://www.suratsilk.example/about')).toBe(
      'suratsilk.example',
    );
  });
});
