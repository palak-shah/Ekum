import { useEffect, useRef, useState } from 'react';
import type { StartDirectThreadResult } from '@ekum/domain-types';
import {
  postCatalogCardsToThread,
  type CatalogCardCollection,
  type CatalogCardProduct,
} from '@/features/browse/postCatalogCardsToThread';
import { selectionMessageAttachmentTitle } from '@/features/browse/selectionMessageAttachmentTitle';
import { api, ApiError } from '@/lib/apiClient';
import { useMyCompany } from '@/lib/queries';
import { useToast } from '@/ui/Toast';
import { SendIcon } from '@/ui/icons';
import { Avatar, Sheet, cx } from '@/ui/kit';
import { FIELD_IDLE_FILL_CLASS } from '@/ui/fieldFill';

type AttachPreview = {
  key: string;
  name: string;
  image: string | null;
  kind: 'Collection' | 'Design';
};

function attachmentPreviews(
  collections: CatalogCardCollection[],
  products: CatalogCardProduct[],
): AttachPreview[] {
  return [
    ...collections.map((entry) => ({
      key: `c-${entry.collectionId}`,
      name: entry.name,
      image: entry.image?.trim() || null,
      kind: 'Collection' as const,
    })),
    ...products.map((entry) => ({
      key: `p-${entry.productId}`,
      name: entry.name,
      image: entry.image?.trim() || null,
      kind: 'Design' as const,
    })),
  ];
}

/**
 * Enquire sheet: quiet To {shop} · visible attachment · your avatar + pill + send.
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
  const toName = shopName.trim() || 'shop';
  const attachmentTitle = selectionMessageAttachmentTitle({ collections, products });
  const previews = attachmentPreviews(collections, products);
  const myName = me.data?.name?.trim() || 'You';

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
      showToast(`Sent to ${toName}`);
      onClose();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Could not send message.', 'danger');
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Message" panelClassName="!max-h-none">
      <div className="flex flex-col gap-2.5" data-testid="selection-message-sheet">
        <p
          data-testid="selection-message-to"
          className="text-[13px] font-body leading-snug text-muted"
        >
          To <span className="font-emphasis text-ink">{toName}</span>
        </p>
        {previews.length > 0 ? (
          <div
            className="flex items-center gap-3 rounded-xl border border-line bg-surface px-2.5 py-2"
            data-testid="selection-message-attachment"
          >
            <div className="relative h-12 w-12 shrink-0">
              {previews.slice(0, 3).map((item, index) => (
                <div
                  key={item.key}
                  className={cx(
                    'absolute overflow-hidden rounded-lg bg-foam',
                    index === 0 ? 'inset-0' : '',
                  )}
                  style={
                    index === 0
                      ? undefined
                      : {
                          width: 28,
                          height: 28,
                          right: -4 * index,
                          bottom: -4 * index,
                          zIndex: index,
                          boxShadow: '0 0 0 1.5px var(--color-surface, #fff)',
                        }
                  }
                >
                  {item.image ? (
                    <img src={item.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-sm font-body text-muted">
                      {item.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-emphasis text-ink">{attachmentTitle}</p>
              <p className="truncate text-xs text-muted">
                {previews.length === 1 ? previews[0]!.kind : 'Attached'}
              </p>
            </div>
          </div>
        ) : null}
        <div className="flex items-center gap-2.5 pb-1" aria-label={`Message ${toName}`}>
          <Avatar name={myName} imageUrl={me.data?.logoUrl} size={36} />
          <div
            className={`flex min-h-11 min-w-0 flex-1 items-center gap-1 rounded-full border border-line ${FIELD_IDLE_FILL_CLASS} pl-3.5 pr-1.5 focus-within:border-line`}
          >
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
      </div>
    </Sheet>
  );
}
