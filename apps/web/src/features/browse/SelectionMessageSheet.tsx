import { useEffect, useRef, useState } from 'react';
import type { StartDirectThreadResult } from '@ekum/domain-types';
import {
  postCatalogCardsToThread,
  type CatalogCardCollection,
  type CatalogCardProduct,
} from '@/features/browse/postCatalogCardsToThread';
import { api, ApiError } from '@/lib/apiClient';
import { useMyCompany } from '@/lib/queries';
import { useToast } from '@/ui/Toast';
import { SendIcon } from '@/ui/icons';
import { Avatar, Sheet, cx } from '@/ui/kit';

/**
 * Quick enquire bar (Instagram-style): avatar + pill + send.
 * One catalog card with the typed note on it (not a Reply bubble).
 */
export function SelectionMessageSheet({
  open,
  onClose,
  shopId,
  shopName,
  collections,
  products,
  placeholder = 'What do you think of this?',
}: {
  open: boolean;
  onClose: () => void;
  shopId: string;
  shopName: string;
  collections: CatalogCardCollection[];
  products: CatalogCardProduct[];
  placeholder?: string;
}) {
  const me = useMyCompany();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const pileCount = collections.length + products.length;

  useEffect(() => {
    if (!open) return;
    setText('');
    setSending(false);
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [open]);

  const onSend = async () => {
    if (!shopId || sending || pileCount === 0) return;
    setSending(true);
    try {
      const thread = await api.post<StartDirectThreadResult>('/threads/direct', {
        companyId: shopId,
      });
      await postCatalogCardsToThread(thread.id, {
        collections,
        products,
        enquireNote: text.trim() || undefined,
      });
      showToast(`Sent to ${shopName.trim() || 'shop'}`);
      onClose();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Could not send message.', 'danger');
    } finally {
      setSending(false);
    }
  };

  const myName = me.data?.name?.trim() || 'You';

  return (
    <Sheet open={open} onClose={onClose} panelClassName="!max-h-none">
      <div
        className="flex items-center gap-2.5 pb-1"
        data-testid="selection-message-sheet"
        aria-label={shopName.trim() ? `Message ${shopName}` : 'Message'}
      >
        <Avatar name={myName} imageUrl={me.data?.logoUrl} size={36} />
        <div className="flex min-h-11 min-w-0 flex-1 items-center gap-1 rounded-full border border-line bg-foam pl-3.5 pr-1.5 focus-within:border-line">
          <input
            ref={inputRef}
            type="text"
            data-testid="selection-message-text"
            disabled={sending}
            value={text}
            placeholder={placeholder}
            enterKeyHint="send"
            className="min-w-0 flex-1 bg-transparent py-2 text-[16px] text-ink placeholder:text-muted outline-none focus:outline-none focus-visible:!outline-none"
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void onSend();
              }
            }}
          />
          <button
            type="button"
            data-testid="selection-message-send"
            disabled={sending || pileCount === 0}
            aria-label={sending ? 'Sending' : 'Send'}
            onClick={() => void onSend()}
            className={cx(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-accent',
              'disabled:opacity-40',
            )}
          >
            <SendIcon width={22} height={22} />
          </button>
        </div>
      </div>
    </Sheet>
  );
}
