import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={22}
      height={22}
      {...props}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
  </Icon>
);

export const ExploreIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icon>
);

/** Category / city filter affordance. */
export const FilterIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 6h16" />
    <path d="M7 12h10" />
    <path d="M10 18h4" />
  </Icon>
);

export const ChatIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12Z" />
  </Icon>
);

export const OrdersIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 4h12l1 4H5l1-4Z" />
    <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
    <path d="M9 12h6" />
  </Icon>
);

/** Explore cart (header + dock Add to cart). */
export const CartIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 7h15l-1.5 9h-12z" />
    <path d="M6 7 5 3H2" />
    <circle cx="9" cy="20" r="1.2" />
    <circle cx="17" cy="20" r="1.2" />
  </Icon>
);

export const PlusIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const BellIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </Icon>
);

export const BackIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m15 18-6-6 6-6" />
  </Icon>
);

export const CloseIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m18 6-12 12" />
    <path d="m6 6 12 12" />
  </Icon>
);

/** Quiet secondary edit (dispatch prior LR, etc.). */
export const PencilIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </Icon>
);

export const ChevronRightIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m9 6 6 6-6 6" />
  </Icon>
);

export const ChevronDownIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);

export const ChevronUpIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m6 15 6-6 6 6" />
  </Icon>
);

/** In-thread / inbox search. */
export const SearchIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icon>
);

/** Native / OS share (iOS upload arrow). */
export const ShareIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3v12" />
    <path d="m8 7 4-4 4 4" />
    <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
  </Icon>
);

/**
 * Open in-app Share (rounded paper plane). Stroke via currentColor / theme.
 * Distinct from SendIcon (chat send) and ShareIcon (native/OS).
 */
export const PaperPlaneIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M21 3 10.5 13.5" />
    <path d="M21 3 14.2 21 10.5 13.5 3 9.8 21 3Z" />
  </Icon>
);

export const CameraIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" />
    <circle cx="12" cy="13" r="3.5" />
  </Icon>
);

/** Gallery / Photos (distinct from Camera). */
export const ImageIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="8.5" cy="10" r="1.5" />
    <path d="m21 15-5-5-8 8" />
  </Icon>
);

export const SendIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 12 20 4l-6 16-3-7-7-1Z" />
  </Icon>
);

export const MoreHorizontalIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </Icon>
);

/** Delete / remove design. */
export const TrashIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 7h16" />
    <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
    <path d="M10 11v6M14 11v6" />
  </Icon>
);

export const CheckIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m5 13 4 4 10-10" />
  </Icon>
);

export const LockIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Icon>
);

/** Unlocked padlock (Has access). */
export const UnlockIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 7.5-1.9" />
  </Icon>
);

export const UserIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20a8 8 0 0 1 16 0" />
  </Icon>
);

export const MegaphoneIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 11v2a1 1 0 0 0 1 1h2l7 4V6L6 10H4a1 1 0 0 0-1 1Z" />
    <path d="M16 9a3 3 0 0 1 0 6" />
  </Icon>
);

/** Pin / unpin chats. */
export const PinIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 17v5" />
    <path d="M9 3h6l1 7-2 1v3l-2 2-2-2v-3l-2-1 1-7Z" />
  </Icon>
);

/**
 * Design / product — triangle dress (client PDF 👗; chats + shop + library).
 * Hanger straps + flared skirt — reads as a garment at 16px, not a lock.
 */
export const ProductIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9 4h6" />
    <path d="M12 4v5" />
    <path d="M8 9h8L20 20.5H4L8 9Z" />
  </Icon>
);

/** Alias — same dress mark as ProductIcon. */
export const DesignIcon = ProductIcon;

/**
 * Collection / album — folder (client PDF 📁; chats + shop + library).
 */
export const CollectionIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3.5 8.5a2 2 0 0 1 2-2h4.2l1.6 1.8H18.5a2 2 0 0 1 2 2v7.2a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V8.5Z" />
  </Icon>
);

/** Catalog Feed layout (single-column posts). */
export const FeedLayoutIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="5" y="4" width="14" height="7" rx="1.5" />
    <rect x="5" y="13" width="14" height="7" rx="1.5" />
  </Icon>
);

/** Catalog Grid layout (tiles). */
export const GridLayoutIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="4" y="4" width="7" height="7" rx="1.2" />
    <rect x="13" y="4" width="7" height="7" rx="1.2" />
    <rect x="4" y="13" width="7" height="7" rx="1.2" />
    <rect x="13" y="13" width="7" height="7" rx="1.2" />
  </Icon>
);

/** Quote / rate card. */
export const QuoteIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 8h5v5H8a3 3 0 0 0-3 3v1h3v-1a1 1 0 0 1 1-1h2V6H6v2Z" />
    <path d="M14 8h5v5h-3a3 3 0 0 0-3 3v1h3v-1a1 1 0 0 1 1-1h2V6h-5v2Z" />
  </Icon>
);

/** Return (future message type). */
export const ReturnIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h11a5 5 0 0 1 0 10h-3" />
  </Icon>
);

/** Document (future attach type). */
export const DocumentIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6M9 17h4" />
  </Icon>
);

/** Packing list / PDF — folded file with PDF letters (reads as PDF, not a generic doc). */
export const PdfIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
    <path d="M14 3v5h5" />
    <text
      x="12"
      y="17.8"
      textAnchor="middle"
      fill="currentColor"
      stroke="none"
      fontSize="6"
      fontWeight="700"
      fontFamily="ui-sans-serif, system-ui, sans-serif"
      letterSpacing="-0.04em"
    >
      PDF
    </text>
  </Icon>
);

/** Saved / bookmark hub. */
export const BookmarkIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.5L6 20V5a1 1 0 0 1 1-1Z" />
  </Icon>
);

/** Explore / Selection Repost (publish under my name). */
export const RepostIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M17 1v6h-6" />
    <path d="M21 11a8 8 0 1 1-2.3-5.6L17 7" />
  </Icon>
);

/** Voice / microphone. */
export const MicIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
    <path d="M5 11a7 7 0 0 0 14 0" />
    <path d="M12 18v3" />
  </Icon>
);
