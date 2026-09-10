/**
 * BM-07 / iOS Safari: keep the mobile shell from growing past the viewport when
 * a child (qty chip rail, default input min-width, etc.) wants more horizontal
 * space. Overflow must clip — not shove fixed bottom nav off-screen.
 */
export const SHELL_X_CONTAIN_CLASS = 'min-w-0 overflow-x-hidden';

/**
 * Form controls without an explicit width use a large intrinsic min-size on
 * WebKit and can expand the page. Always bound to the content column.
 */
export const FORM_CONTROL_WIDTH_CLASS = 'box-border w-full min-w-0 max-w-full';
