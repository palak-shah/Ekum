type Listener = () => void;

/** Empty Selecting must be shared across nested hook instances (Explore page vs feed). */
export function createArmedSelectFlag() {
  let armed = false;
  const listeners = new Set<Listener>();
  const emit = () => {
    for (const listener of listeners) listener();
  };
  return {
    subscribe(listener: Listener): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    get(): boolean {
      return armed;
    },
    set(on: boolean): void {
      if (armed === on) return;
      armed = on;
      emit();
    },
  };
}
