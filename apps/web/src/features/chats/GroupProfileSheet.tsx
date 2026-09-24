import { useRef, useState } from 'react';
import type { ThreadDetail } from '@ekum/domain-types';
import { uploadImage } from '@/lib/mediaUpload';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';
import { Button, Field, Sheet, TextInput } from '@/ui/kit';

export function GroupProfileSheet({
  open,
  detail,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  detail: ThreadDetail;
  saving: boolean;
  onClose: () => void;
  onSave: (body: { imageUrl?: string | null; blurb?: string | null }) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [blurb, setBlurb] = useState(detail.blurb ?? '');
  const [imageUrl, setImageUrl] = useState(detail.imageUrl ?? '');
  const [busy, setBusy] = useState(false);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Group"
      footer={
        <Button
          fullWidth
          disabled={saving || busy}
          onClick={() =>
            onSave({
              blurb: blurb.trim() || null,
              imageUrl: imageUrl.trim() || null,
            })
          }
        >
          Save
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        <button
          type="button"
          data-testid="group-photo-pick"
          className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-line bg-foam text-sm font-semibold text-muted"
          onClick={() => fileRef.current?.click()}
        >
          {imageUrl ? (
            <img src={toAbsoluteMediaUrl(imageUrl) ?? imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            'Photo'
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) return;
            setBusy(true);
            void uploadImage(file)
              .then((url) => setImageUrl(url))
              .finally(() => setBusy(false));
          }}
        />
        <Field label="One line">
          <TextInput
            value={blurb}
            maxLength={80}
            data-testid="group-blurb"
            onChange={(event) => setBlurb(event.target.value)}
            placeholder="What this group is for"
          />
        </Field>
      </div>
    </Sheet>
  );
}
