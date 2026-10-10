import { createContext, useContext } from 'react';

/**
 * True when MessageChrome pads the bubble (`pr-8`) for the actions chevron.
 * Trade-card section bleed must match — otherwise overflow-hidden clips the right edge.
 */
export const MessageBubbleChevronPadContext = createContext(false);

export function useMessageBubbleChevronPad(): boolean {
  return useContext(MessageBubbleChevronPadContext);
}
