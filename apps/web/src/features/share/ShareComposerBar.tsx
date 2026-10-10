import { useEffect, useRef } from 'react';
import { SendIcon, ShareIcon } from '@/ui/icons';
import { cx } from '@/ui/kit';
import { chatComposerHeightPx } from '@/features/chats/chatComposerHeight';

/**
 * Chat-like message bar without attach (+).
 * Primary Send (accent fill); quieter native ShareIcon beside it.
 */
export function ShareComposerBar({
  value,
  onChange,
  onSend,
  onNativeShare,
  sendDisabled,
  nativeDisabled,
  busy,
  showNative = true,
  placeholder = 'Add a message…',
  sendTestId = 'share-send',
  nativeTestId = 'share-native',
}: {
  value: string;
  onChange: (next: string) => void;
  onSend: () => void;
  onNativeShare?: () => void;
  sendDisabled?: boolean;
  nativeDisabled?: boolean;
  busy?: boolean;
  showNative?: boolean;
  placeholder?: string;
  sendTestId?: string;
  nativeTestId?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${chatComposerHeightPx(el.scrollHeight)}px`;
  }, [value]);

  const canSend = !sendDisabled && !busy;

  return (
    <div className="flex min-w-0 items-end gap-2" data-testid="share-composer">
      <div
        className={cx(
          'flex min-h-11 min-w-0 flex-1 items-end rounded-2xl border bg-foam px-3 py-1.5',
          'border-line focus-within:border-accent/50',
        )}
      >
        <textarea
          ref={ref}
          data-testid="share-composer-text"
          rows={1}
          enterKeyHint="send"
          disabled={busy}
          value={value}
          placeholder={placeholder}
          className="ekum-no-scrollbar max-h-[120px] min-h-9 min-w-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent px-0.5 py-2 text-[16px] leading-5 text-ink shadow-none outline-none ring-0 placeholder:text-muted focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none disabled:opacity-50"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              if (canSend) onSend();
            }
          }}
        />
      </div>
      <button
        type="button"
        aria-label="Send"
        data-testid={sendTestId}
        disabled={!canSend}
        onClick={onSend}
        className={cx(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
          canSend ? 'bg-accent text-white' : 'bg-line text-muted',
        )}
      >
        <SendIcon width={20} height={20} />
      </button>
      {showNative && onNativeShare ? (
        <button
          type="button"
          aria-label="Share outside"
          data-testid={nativeTestId}
          disabled={nativeDisabled || busy}
          onClick={onNativeShare}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink/70 hover:bg-foam hover:text-ink disabled:opacity-40"
        >
          <ShareIcon width={20} height={20} />
        </button>
      ) : null}
    </div>
  );
}
