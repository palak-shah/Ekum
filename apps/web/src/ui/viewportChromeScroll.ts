/** Android Chrome URL-bar show/hide fires `scroll` on the document — not a list swipe. */
export function isViewportChromeScroll(event: Event): boolean {
  const target = event.target;
  return (
    target === window ||
    target === document ||
    target === document.documentElement ||
    target === document.body
  );
}
