import { ChatTradeCard } from './ChatTradeCardView';
import type { ChatTradeCardModel } from './chatTradeCard';

const now = new Date().toISOString();
const thumbs = [
  'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=120&h=120&fit=crop',
  'https://images.unsplash.com/photo-1586495777744-4413f210af78?w=120&h=120&fit=crop',
  'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=120&h=120&fit=crop',
  'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=120&h=120&fit=crop',
];

function card(partial: Partial<ChatTradeCardModel> & Pick<ChatTradeCardModel, 'primary' | 'mine' | 'kind'>): ChatTradeCardModel {
  return {
    who: partial.mine ? 'You' : 'Surat Silk House',
    details: partial.details ?? ['9 designs · 20 pcs each'],
    thumbs: partial.variant === 'pulse' ? [] : thumbs.slice(0, 4),
    thumbOverflow: partial.variant === 'pulse' ? 0 : 2,
    createdAt: now,
    variant: 'bubble',
    ...partial,
  };
}

const CASES: { id: string; label: string; model: ChatTradeCardModel }[] = [
  {
    id: 'in-inquiry',
    label: '1 Incoming Inquiry',
    model: card({
      mine: false,
      kind: 'order',
      primary: 'Order #FS3C · Inquiry',
      action: { label: 'View inquiry →', to: '#', style: 'link' },
    }),
  },
  {
    id: 'out-inquiry',
    label: '2 Outgoing Inquiry',
    model: card({
      mine: true,
      kind: 'order',
      primary: 'Order #FS3C · Inquiry',
      action: { label: 'View inquiry →', to: '#', style: 'link' },
    }),
  },
  {
    id: 'in-order',
    label: '3 Incoming Order',
    model: card({
      mine: false,
      kind: 'order',
      primary: 'Order #FS3C · Accepted',
      action: { label: 'View order →', to: '#', style: 'link' },
    }),
  },
  {
    id: 'out-order',
    label: '4 Outgoing Order',
    model: card({
      mine: true,
      kind: 'order',
      primary: 'Order #FS3C · Accepted',
      action: { label: 'View order →', to: '#', style: 'link' },
    }),
  },
  {
    id: 'in-quote',
    label: '5 Incoming Quote',
    model: card({
      mine: false,
      kind: 'quote',
      primary: 'Order #MGYF · Quote',
      details: ['₹2,83,800', '9 designs · 20 pcs each'],
      action: { label: 'Accept quote', onClick: () => undefined, style: 'primary' },
      secondaryAction: { label: 'View order →', onClick: () => undefined },
    }),
  },
  {
    id: 'out-quote',
    label: '6 Outgoing Quote',
    model: card({
      mine: true,
      kind: 'quote',
      primary: 'Order #MGYF · Quote',
      details: ['₹2,83,800', '9 designs · 20 pcs each'],
      action: { label: 'View order →', to: '#', style: 'link' },
    }),
  },
  {
    id: 'out-updated',
    label: '7 Updated Inquiry (outgoing)',
    model: card({
      mine: true,
      kind: 'order',
      primary: 'Order #FS3C · Updated',
      action: { label: 'View inquiry →', to: '#', style: 'link' },
    }),
  },
  {
    id: 'out-dispatched',
    label: '8 Dispatched Order (outgoing pulse)',
    model: card({
      mine: true,
      kind: 'order',
      variant: 'pulse',
      primary: 'Order #FS3C · Dispatched',
      who: undefined,
      details: [],
      action: { label: 'View order →', to: '#', style: 'link' },
    }),
  },
];

/** Visual QA only — direction surface rule at 390px. */
export function ChatTradeDirectionGalleryPage() {
  return (
    <div className="min-h-dvh bg-canvas px-3 py-4" data-testid="chat-trade-direction-gallery">
      <p className="mb-3 text-[13px] font-semibold text-ink">Chat business-object direction rule</p>
      <div className="flex flex-col gap-5">
        {CASES.map((row) => (
          <section key={row.id} data-case={row.id} className="flex flex-col gap-1.5">
            <p className="text-[11px] font-medium text-muted">{row.label}</p>
            <div className={row.model.mine ? 'flex justify-end' : 'flex justify-start'}>
              <div className="w-[85%]">
                <ChatTradeCard model={row.model} />
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
