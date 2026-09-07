/** Per-corner radii so the WhatsApp-style tail isn’t overridden by `rounded-2xl`. */
export function chatBubbleCorners(mine: boolean): string {
  return mine
    ? 'rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-sm'
    : 'rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-sm';
}
