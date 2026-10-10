import { createContext, useContext } from 'react';

/** Virtual Explore list remasure — caption expand/collapse must refresh row sizes. */
export const ExploreFeedMeasureContext = createContext<(() => void) | null>(null);

export function useExploreFeedRemeasure(): () => void {
  return useContext(ExploreFeedMeasureContext) ?? (() => undefined);
}
