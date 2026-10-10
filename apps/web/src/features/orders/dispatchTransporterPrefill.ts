/** Seed Dispatch Transporter from buyer preference on the order. */
export function dispatchTransporterPrefill(
  orderTransporter: string | null | undefined,
): string | undefined {
  const trimmed = orderTransporter?.trim();
  return trimmed || undefined;
}
