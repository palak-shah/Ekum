import type { OrderPathPreference } from '@ekum/domain-types';
import { OrderPathPreference as Path } from '@ekum/domain-types';

/** Residual pack/default path: missing ⇒ I handle (Profile control removed). */
export function resolveOrderPathPreference(
  tradeDefaults: Record<string, unknown> | null | undefined,
): OrderPathPreference {
  return tradeDefaults?.orderPathPreference === Path.Direct ? Path.Direct : Path.Handle;
}

export function effectiveOrderPath(input: {
  profileDefault: OrderPathPreference;
  override: OrderPathPreference | null | undefined;
}): OrderPathPreference {
  return input.override ?? input.profileDefault;
}
