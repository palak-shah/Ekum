/** Per-corner radii so the WhatsApp-style tail isn’t overridden by `rounded-2xl`. */
export function chatBubbleCorners(
  mine: boolean,
  options?: { tail?: boolean },
): string {
  const tail = options?.tail !== false;
  if (!tail) return 'rounded-2xl';
  return mine
    ? 'relative rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-sm ekum-msg-tail-out'
    : 'relative rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-sm ekum-msg-tail-in';
}
