import { ChevronDownIcon } from '@/ui/icons';

/** WhatsApp-style small down arrow — jump to newest when reading older messages. */
export function ThreadJumpToLatest({
  visible,
  onJump,
}: {
  visible: boolean;
  onJump: () => void;
}) {
  if (!visible) return null;
  return (
    <button
      type="button"
      data-testid="thread-jump-latest"
      aria-label="Latest messages"
      onClick={onJump}
      className="absolute bottom-3 right-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-md"
    >
      <ChevronDownIcon width={20} height={20} />
    </button>
  );
}
