export function showGroupSenderThumb(input: {
  isGroup: boolean;
  incoming: boolean;
}): boolean {
  return input.isGroup && input.incoming;
}
