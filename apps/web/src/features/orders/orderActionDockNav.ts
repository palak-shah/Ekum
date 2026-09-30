type Listener = () => void;

const listeners = new Set<Listener>();
let visible = false;

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeOrderActionDockNav(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getOrderActionDockNavVisible(): boolean {
  return visible;
}

export function setOrderActionDockNavVisible(next: boolean): void {
  if (visible === next) return;
  visible = next;
  emit();
}
