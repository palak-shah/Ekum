import type { OrderPathPreference } from '@ekum/domain-types';
import { OrderPathPreference as Path } from '@ekum/domain-types';

/** Profile / pack default: missing ⇒ Direct. */
export function resolveOrderPathPreference(
  tradeDefaults: Record<string, unknown> | null | undefined,
): OrderPathPreference {
  return tradeDefaults?.orderPathPreference === Path.Handle ? Path.Handle : Path.Direct;
}

export function effectiveOrderPath(input: {
  profileDefault: OrderPathPreference;
  override: OrderPathPreference | null | undefined;
}): OrderPathPreference {
  return input.override ?? input.profileDefault;
}
