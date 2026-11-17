import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { MessageType, type StartDirectThreadResult } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useMyCompany } from '@/lib/queries';
import { useToast } from '@/ui/Toast';
import { SendIcon } from '@/ui/icons';
import { Avatar, Sheet, cx } from '@/ui/kit';
import { FIELD_IDLE_FILL_CLASS } from '@/ui/fieldFill';
import { directOpenToast } from './directOpenToast';

/**
 * Cold Message when no Direct exists yet: compose first text, then create thread + send.
 * Existing Directs open on the caller — do not use this sheet.
 */
export function FirstMessageSheet({
  open,
  onClose,
  onSent,
  companyId,
  companyName,
  memberUserIds = [],
  placeholder = 'Write a message…',
}: {
  open: boolean;
  onClose: () => void;
  /** After a successful first send (parent may dismiss its own sheet). */
  onSent?: () => void;
  companyId: string;
  companyName: string;
  memberUserIds?: string[];
  placeholder?: string;
}) {
  const me = useMyCompany();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const toName = companyName.trim() || 'shop';
  const myName = me.data?.name?.trim() || 'You';
  const canSend = text.trim().length > 0 && Boolean(companyId);

  useEffect(() => {
    if (!open) return;
    setText('');
    setSending(false);
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [open, companyId]);

  const onSend = async () => {
    const body = text.trim();
    if (!companyId || sending || !body) return;
    setSending(true);
    try {
      const thread = await api.post<StartDirectThreadResult>('/threads/direct', {
        companyId,
        visibility: 'shared',
        memberUserIds,
      });
      await api.post(`/threads/${thread.id}/messages`, {
        type: MessageType.Text,
        body,
      });
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      showToast(directOpenToast(toName, thread.opened), 'success');
      onClose();
      onSent?.();
      navigate(`/chats/${thread.id}`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Could not send message.', 'danger');
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Message" panelClassName="!max-h-none">
      <div className="flex flex-col gap-2.5" data-testid="first-message-sheet">
        <p
          data-testid="first-message-to"
          className="text-meta font-body leading-snug text-muted"
        >
          To <span className="font-emphasis text-ink">{toName}</span>
        </p>
        <div className="flex items-center gap-2.5 pb-1" aria-label={`Message ${toName}`}>
          <Avatar name={myName} imageUrl={me.data?.logoUrl} size={36} />
          <div
            className={`flex min-h-11 min-w-0 flex-1 items-center gap-1 rounded-full border border-line ${FIELD_IDLE_FILL_CLASS} pl-3.5 pr-1.5 focus-within:border-line`}
          >
            <input
              ref={inputRef}
              type="text"
              data-testid="first-message-text"
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
              data-testid="first-message-send"
              disabled={sending || !canSend}
              aria-label={sending ? 'Sending' : 'Send'}
              onClick={() => void onSend()}
              className={cx(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-accent',
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
