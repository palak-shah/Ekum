import { designBrowsePhotoClass } from '@/lib/designBrowseLayout';
import { DesignPhotoCarousel } from '@/ui/DesignPhotoCarousel';

/** Collection Feed tile — shared DesignPhotoCarousel with feed 4∶5 chrome. */
export function FeedDesignPhotoCarousel({
  urls,
  name,
  selectMode,
  selected,
  unavailableReason,
  rateOverlay,
  onActivate,
  onLongSelect,
}: {
  urls: string[];
  name: string;
  selectMode: boolean;
  selected: boolean;
  unavailableReason?: string;
  rateOverlay?: string | null;
  onActivate: (photoIndex: number) => void;
  onLongSelect?: () => void;
}) {
  return (
    <DesignPhotoCarousel
      urls={urls}
      name={name}
      photoClassName={designBrowsePhotoClass('feed')}
      placeholderClassName={designBrowsePhotoClass('feed', 'placeholder')}
      selectMode={selectMode}
      selected={selected}
      unavailableReason={unavailableReason}
      rateOverlay={rateOverlay}
      onActivate={onActivate}
      onLongSelect={onLongSelect}
      testId="collection-feed-photo-carousel"
    />
  );
}
