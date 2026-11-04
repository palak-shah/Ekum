import { useState } from 'react';
import { NoteAttachField } from '@/features/voice/NoteAttachField';
import type { NoteVoiceValue } from '@/features/voice/NoteVoiceField';
import { VoicePlayer } from '@/features/voice/VoicePlayer';
import { MEDIA_VARIANT } from '@ekum/domain-types';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';
import { explorePostedWhen } from '@/ui/cards';
import { THREAD_COMPOSER_CONTROL_CLASS } from '@/ui/fieldFill';
import { Card, InlineNotice, Sheet, cx, listRowClass } from '@/ui/kit';
import { ManagedImage } from '@/ui/ManagedImage';
import { FwdIcon, SendIcon } from '@/ui/icons';
import { DisclosureChevron } from './DisclosureChevron';
import type { OrderTicketNote } from './orderTicketChrome';

const TICKET_NOTES_VISIBLE = 3;

export function OrderTicketNotes({
  notes,
  canForward,
  note,
  onNoteChange,
  voice,
  onVoiceChange,
  images,
  onImagesChange,
  onAdd,
  adding,
  error,
  onForward,
  forwarding,
  millPickOpen,
  millPickMills,
  onPickMill,
  onCloseMillPick,
  onOpenNotePhotos,
  audienceCue = 'Both sides see these',
}: {
  notes: OrderTicketNote[];
  canForward: boolean;
  note: string;
  onNoteChange: (value: string) => void;
  voice: NoteVoiceValue;
  onVoiceChange: (value: NoteVoiceValue) => void;
  images: string[];
  onImagesChange: (urls: string[]) => void;
  onAdd: () => void;
  adding: boolean;
  error: string | null;
  onForward: (noteId: string) => void;
  forwarding: boolean;
  millPickOpen: boolean;
  millPickMills: Array<{ orderId: string; name: string }>;
  onPickMill: (orderId: string) => void;
  onCloseMillPick: () => void;
  onOpenNotePhotos: (urls: string[], index: number, caption: string) => void;
  /** Who sees these notes — Manage desk uses you and the buyer. */
  audienceCue?: string;
}) {
  const canSubmit = Boolean(note.trim() || voice || images.length > 0);
  const [moreOpen, setMoreOpen] = useState(false);
  const extra = Math.max(0, notes.length - TICKET_NOTES_VISIBLE);
  const shown = moreOpen || extra === 0 ? notes : notes.slice(-TICKET_NOTES_VISIBLE);
  const moreCue =
    extra <= 0 ? null : extra === 1 ? '1 more note' : `${extra} more notes`;
  return (
    <>
      <Card className="flex flex-col gap-3" data-testid="order-ticket-notes">
        <div className="flex items-baseline justify-between gap-8">
          <p className="text-sm font-title text-ink">Notes & comments</p>
          <p
            className="text-meta font-body text-muted"
            data-testid="order-notes-audience"
          >
            {audienceCue}
          </p>
        </div>
        {notes.length === 0 ? (
          <p className="text-meta text-muted">No notes yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {moreCue ? (
              <li>
                <button
                  type="button"
                  data-testid="order-notes-more"
                  className="flex cursor-pointer items-center gap-0.5 py-1 text-sm font-emphasis text-muted"
                  onClick={() => setMoreOpen((open) => !open)}
                >
                  {moreOpen ? 'View less' : moreCue}
                  <DisclosureChevron open={moreOpen} />
                </button>
              </li>
            ) : null}
            {shown.map((row) => (
              <li
                key={row.id}
                className={cx(
                  'rounded-lg px-2.5 py-2 text-[13.5px] leading-snug text-slate',
                  row.mine ? 'bg-chat-out' : 'bg-foam',
                )}
                data-testid="order-ticket-note"
              >
                <div className="mb-0.5 flex items-baseline justify-between gap-8 text-xs text-muted">
                  <b className="font-title text-ink">{row.who}</b>
                  <span>{explorePostedWhen(row.at)}</span>
                </div>
                {row.cue ? <p className="mb-0.5 text-xs text-muted">{row.cue}</p> : null}
                {row.note ? (
                  <p className="whitespace-pre-wrap text-slate">{row.note}</p>
                ) : null}
                {row.forwarded ? (
                  <p className="mt-0.5 text-xs text-muted" data-testid="order-note-forwarded">
                    Forwarded
                    {canForward ? (
                      <>
                        <br />
                        Write a new note to forward again
                      </>
                    ) : null}
                  </p>
                ) : null}
                {row.noteVoiceUrl ? (
                  <VoicePlayer src={row.noteVoiceUrl} durationMs={row.noteVoiceDurationMs} />
                ) : null}
                {(row.noteImageUrls.length ?? 0) > 0 ? (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {row.noteImageUrls.map((url, index) => (
                      <button
                        key={url}
                        type="button"
                        aria-label="View note photo"
                        className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-foam"
                        onClick={() => onOpenNotePhotos(row.noteImageUrls, index, 'Note')}
                      >
                        <ManagedImage
                          src={toAbsoluteMediaUrl(url)}
                          alt=""
                          variant={MEDIA_VARIANT.Thumbnail1}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
                {canForward && row.forwardable && !row.forwarded ? (
                  <button
                    type="button"
                    data-testid="order-note-forward"
                    disabled={forwarding}
                    aria-label="Forward"
                    className="mt-1 inline-flex w-fit items-center gap-1 text-sm font-emphasis text-muted hover:text-ink disabled:opacity-40"
                    onClick={() => onForward(row.id)}
                  >
                    <FwdIcon width={16} height={16} aria-hidden />
                    Forward
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <NoteAttachField
          label="Note"
          layout="composer"
          collapseEmpty={false}
          optional
          placeholder="Add a note on this order"
          note={note}
          onNoteChange={onNoteChange}
          voice={voice}
          onVoiceChange={onVoiceChange}
          images={images}
          onImagesChange={onImagesChange}
          onComposerSubmit={onAdd}
          composerSubmitDisabled={adding}
          testId="order-ticket-note-attach"
          inputTestId="order-ticket-note-input"
          endSlot={
            <button
              type="button"
              data-testid="order-ticket-note-send"
              aria-label="Send"
              disabled={!canSubmit || adding}
              onClick={onAdd}
              className={cx(
                THREAD_COMPOSER_CONTROL_CLASS,
                canSubmit
                  ? 'bg-accent text-on-accent disabled:opacity-40'
                  : 'text-muted opacity-45',
              )}
            >
              <SendIcon width={18} height={18} />
            </button>
          }
        />
        {error ? <InlineNotice message={error} /> : null}
      </Card>
      <Sheet open={millPickOpen} onClose={onCloseMillPick} title="Forward to">
        <ul className="-mx-4">
          {millPickMills.map((mill) => (
            <li key={mill.orderId}>
              <button
                type="button"
                data-testid="order-note-forward-mill"
                className={cx(listRowClass, 'flex w-full text-left')}
                onClick={() => onPickMill(mill.orderId)}
              >
                <span className="text-sm font-emphasis text-ink">{mill.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  );
}
