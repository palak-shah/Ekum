/** Shop hours are always interpreted in India Standard Time. */
export const SHOP_HOURS_TIMEZONE = 'Asia/Kolkata';

export const SHOP_WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type ShopWeekday = (typeof SHOP_WEEKDAYS)[number];

export const SHOP_WEEKDAY_LABEL: Record<ShopWeekday, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const WEEKDAY_FROM_SHORT: Record<string, ShopWeekday> = {
  Mon: 'mon',
  Tue: 'tue',
  Wed: 'wed',
  Thu: 'thu',
  Fri: 'fri',
  Sat: 'sat',
  Sun: 'sun',
};

export type ShopWorkingHours = {
  opensAt: string;
  closesAt: string;
  weeklyOff: ShopWeekday | null;
};

export type ShopAddress = {
  unit: string | null;
  street: string | null;
  area: string | null;
  pincode: string | null;
};

export function parseShopHhmm(value: string): number | null {
  const trimmed = value.trim();
  if (!HHMM.test(trimmed)) return null;
  const [hoursPart, minutesPart] = trimmed.split(':');
  const hours = Number(hoursPart);
  const minutes = Number(minutesPart);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

export function shopHoursAreSameDay(opensAt: string, closesAt: string): boolean {
  const opens = parseShopHhmm(opensAt);
  const closes = parseShopHhmm(closesAt);
  if (opens == null || closes == null) return false;
  return closes > opens;
}

export type ShopMeridiem = 'AM' | 'PM';

/** Edit Profile clock parts (stored as HH:mm 24h). */
export type ShopClock12 = {
  hour12: number;
  minute: number;
  meridiem: ShopMeridiem;
};

export const SHOP_CLOCK_HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export const SHOP_CLOCK_MINUTES = [0, 15, 30, 45] as const;

export function snapShopMinute(minute: number): (typeof SHOP_CLOCK_MINUTES)[number] {
  let best: (typeof SHOP_CLOCK_MINUTES)[number] = 0;
  let bestDist = Infinity;
  for (const option of SHOP_CLOCK_MINUTES) {
    const dist = Math.abs(option - minute);
    if (dist < bestDist) {
      best = option;
      bestDist = dist;
    }
  }
  return best;
}

export function parseShopHhmmToClock12(hhmm: string): ShopClock12 | null {
  const total = parseShopHhmm(hhmm);
  if (total == null) return null;
  const hour24 = Math.floor(total / 60);
  const minute = snapShopMinute(total % 60);
  const meridiem: ShopMeridiem = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { hour12, minute, meridiem };
}

export function formatShopClock12ToHhmm(clock: ShopClock12): string | null {
  if (!SHOP_CLOCK_HOURS.includes(clock.hour12 as (typeof SHOP_CLOCK_HOURS)[number])) {
    return null;
  }
  if (!SHOP_CLOCK_MINUTES.includes(clock.minute as (typeof SHOP_CLOCK_MINUTES)[number])) {
    return null;
  }
  if (clock.meridiem !== 'AM' && clock.meridiem !== 'PM') return null;
  let hour24 = clock.hour12 % 12;
  if (clock.meridiem === 'PM') hour24 += 12;
  return `${String(hour24).padStart(2, '0')}:${String(clock.minute).padStart(2, '0')}`;
}

export function formatShopTime12(hhmm: string): string {
  const minutes = parseShopHhmm(hhmm);
  if (minutes == null) return hhmm;
  const hour24 = Math.floor(minutes / 60);
  const min = minutes % 60;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(min).padStart(2, '0')} ${period}`;
}

export function shopLocalClock(
  now: Date,
  timeZone = SHOP_HOURS_TIMEZONE,
): { weekday: ShopWeekday; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const weekdayShort = parts.find((part) => part.type === 'weekday')?.value ?? 'Mon';
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');
  return {
    weekday: WEEKDAY_FROM_SHORT[weekdayShort] ?? 'mon',
    minutes: hour * 60 + minute,
  };
}

function weekdayIndex(day: ShopWeekday): number {
  return SHOP_WEEKDAYS.indexOf(day);
}

function addWeekdays(day: ShopWeekday, days: number): ShopWeekday {
  const next = (weekdayIndex(day) + days) % 7;
  return SHOP_WEEKDAYS[next] ?? 'mon';
}

export function isShopOpenNow(
  hours: ShopWorkingHours,
  now: Date,
  timeZone = SHOP_HOURS_TIMEZONE,
): boolean {
  const clock = shopLocalClock(now, timeZone);
  if (hours.weeklyOff && clock.weekday === hours.weeklyOff) return false;
  const opens = parseShopHhmm(hours.opensAt);
  const closes = parseShopHhmm(hours.closesAt);
  if (opens == null || closes == null || closes <= opens) return false;
  return clock.minutes >= opens && clock.minutes < closes;
}

function nextOpen(
  hours: ShopWorkingHours,
  now: Date,
  timeZone = SHOP_HOURS_TIMEZONE,
): { dayOffset: number; weekday: ShopWeekday } | null {
  const clock = shopLocalClock(now, timeZone);
  const opens = parseShopHhmm(hours.opensAt);
  if (opens == null) return null;
  const todayIsOff = hours.weeklyOff === clock.weekday;
  if (!todayIsOff && clock.minutes < opens) {
    return { dayOffset: 0, weekday: clock.weekday };
  }
  for (let offset = 1; offset <= 7; offset += 1) {
    const weekday = addWeekdays(clock.weekday, offset);
    if (hours.weeklyOff !== weekday) {
      return { dayOffset: offset, weekday };
    }
  }
  return null;
}

export function shopHoursCaption(
  hours: ShopWorkingHours | null | undefined,
  now: Date,
  timeZone = SHOP_HOURS_TIMEZONE,
): string | null {
  if (!hours?.opensAt || !hours.closesAt) return null;
  if (!shopHoursAreSameDay(hours.opensAt, hours.closesAt)) return null;
  const range = `${formatShopTime12(hours.opensAt)} – ${formatShopTime12(hours.closesAt)}`;
  const off =
    hours.weeklyOff != null ? ` · ${SHOP_WEEKDAY_LABEL[hours.weeklyOff]} off` : '';
  if (isShopOpenNow(hours, now, timeZone)) {
    return `Open now · ${range}${off}`;
  }
  const upcoming = nextOpen(hours, now, timeZone);
  if (!upcoming) return `Closed now · ${range}${off}`;
  const at = formatShopTime12(hours.opensAt);
  if (upcoming.dayOffset === 0) {
    return `Closed now · Opens at ${at}`;
  }
  if (upcoming.dayOffset === 1) {
    return `Closed now · Opens at ${at} tomorrow`;
  }
  return `Closed now · Opens ${SHOP_WEEKDAY_LABEL[upcoming.weekday]} at ${at}`;
}

export function shopWeekHoursLines(hours: ShopWorkingHours): { weekday: ShopWeekday; line: string }[] {
  const range = `${formatShopTime12(hours.opensAt)} – ${formatShopTime12(hours.closesAt)}`;
  return SHOP_WEEKDAYS.map((weekday) => ({
    weekday,
    line:
      hours.weeklyOff === weekday
        ? `${SHOP_WEEKDAY_LABEL[weekday]} · Off`
        : `${SHOP_WEEKDAY_LABEL[weekday]} · ${range}`,
  }));
}

export function blankToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function formatShopAddress(
  address: ShopAddress | null | undefined,
  city: string | null | undefined,
): string | null {
  if (!address) return null;
  const parts = [
    blankToNull(address.unit),
    blankToNull(address.street),
    blankToNull(address.area),
    blankToNull(address.pincode),
    blankToNull(city),
  ].filter((part): part is string => Boolean(part));
  const hasStreet = Boolean(
    blankToNull(address.unit) ||
      blankToNull(address.street) ||
      blankToNull(address.area) ||
      blankToNull(address.pincode),
  );
  if (!hasStreet) return null;
  return parts.join(', ');
}

export function shopMapsSearchUrl(formattedAddress: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formattedAddress)}`;
}

function parseHttpUrl(raw: string): { protocol: 'http' | 'https'; host: string; rest: string } | null {
  const match = raw.match(/^(https?):\/\/([^/?#]+)([^?#]*)?(\?[^#]*)?(#.*)?$/i);
  if (!match) return null;
  const protocol = match[1]?.toLowerCase() === 'http' ? 'http' : 'https';
  const host = match[2]?.toLowerCase() ?? '';
  const path = match[3] && match[3].length > 0 ? match[3] : '/';
  const search = match[4] ?? '';
  return { protocol, host, rest: `${path}${search}` };
}

export function normalizeWebsiteUrl(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim() ?? '';
  if (!trimmed) return null;
  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  const parsed = parseHttpUrl(withScheme);
  if (!parsed) return null;
  const hostname = parsed.host.split(':')[0] ?? '';
  if (!hostname || hostname === 'localhost') return null;
  if (!hostname.includes('.')) return null;
  return `${parsed.protocol}://${parsed.host}${parsed.rest}`;
}

export function websiteDisplayHost(url: string): string {
  const parsed = parseHttpUrl(url);
  const hostname = parsed?.host.split(':')[0] ?? url;
  return hostname.replace(/^www\./i, '');
}
