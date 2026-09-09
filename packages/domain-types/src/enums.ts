/**
 * Canonical enums for the Ekum domain. These are the single source of truth for
 * valid values shared between the API and the web app (and, later, the Flutter
 * client via a generated contract).
 *
 * Each enum is a plain string-const object so the values are stable, readable in
 * the database and on the wire, and safe to feed into `z.enum(...)`.
 */

function values<T extends Record<string, string>>(e: T): [T[keyof T], ...T[keyof T][]] {
  return Object.values(e) as [T[keyof T], ...T[keyof T][]];
}

/** Company capabilities unlock progressively; stored as data, never a role enum. */
export const CompanyCapability = {
  Publish: 'publish',
  Relist: 'relist',
  Refer: 'refer',
} as const;
export type CompanyCapability = (typeof CompanyCapability)[keyof typeof CompanyCapability];
export const companyCapabilityValues = values(CompanyCapability);

/** A user's role within a company they are a member of. */
export const MembershipRole = {
  Owner: 'owner',
  Staff: 'staff',
} as const;
export type MembershipRole = (typeof MembershipRole)[keyof typeof MembershipRole];
export const membershipRoleValues = values(MembershipRole);

/** Per-user permissions inside a company (owner-set hard caps). */
export const MembershipPermission = {
  Uploads: 'uploads',
  Chats: 'chats',
  Orders: 'orders',
  Payments: 'payments',
  Team: 'team',
} as const;
export type MembershipPermission =
  (typeof MembershipPermission)[keyof typeof MembershipPermission];
export const membershipPermissionValues = values(MembershipPermission);

/** Access is the named, permissioned gate (distinct from permissionless Follow). */
export const AccessRequestStatus = {
  Pending: 'pending',
  Approved: 'approved',
  Declined: 'declined',
} as const;
export type AccessRequestStatus = (typeof AccessRequestStatus)[keyof typeof AccessRequestStatus];
export const accessRequestStatusValues = values(AccessRequestStatus);

/** The ongoing connection state once access is approved. Pause/block are silent. */
export const ConnectionStatus = {
  Active: 'active',
  Paused: 'paused',
  Blocked: 'blocked',
} as const;
export type ConnectionStatus = (typeof ConnectionStatus)[keyof typeof ConnectionStatus];
export const connectionStatusValues = values(ConnectionStatus);

export const VerificationStatus = {
  NotVerified: 'not_verified',
  GstVerified: 'gst_verified',
} as const;
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];
export const verificationStatusValues = values(VerificationStatus);

/** Catalog. Publish is a state; sharing is a separate event. Ready = company review queue. */
export const CollectionStatus = {
  Draft: 'draft',
  Ready: 'ready',
  Published: 'published',
  Archived: 'archived',
} as const;
export type CollectionStatus = (typeof CollectionStatus)[keyof typeof CollectionStatus];
export const collectionStatusValues = values(CollectionStatus);

/** A product carries the same lifecycle: a private draft, published, or archived. */
export const ProductStatus = {
  Draft: 'draft',
  Published: 'published',
  Archived: 'archived',
} as const;
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];
export const productStatusValues = values(ProductStatus);

/** Rates default to "on request" per standard trade practice. */
export const RateVisibility = {
  Visible: 'visible',
  OnRequest: 'on_request',
} as const;
export type RateVisibility = (typeof RateVisibility)[keyof typeof RateVisibility];
export const rateVisibilityValues = values(RateVisibility);

export const PublishAudience = {
  Everyone: 'everyone',
  Connections: 'connections',
  Followers: 'followers',
  Selected: 'selected',
} as const;
export type PublishAudience = (typeof PublishAudience)[keyof typeof PublishAudience];
export const publishAudienceValues = values(PublishAudience);

/** Trade units. SKU/reference codes remain optional; units do not. */
export const Unit = {
  Piece: 'pc',
  Set: 'set',
  Metre: 'mtr',
  Than: 'than',
  Dozen: 'dozen',
  Kilogram: 'kg',
  Box: 'box',
} as const;
export type Unit = (typeof Unit)[keyof typeof Unit];
export const unitValues = values(Unit);

/**
 * One Order object, viewed from two perspectives. Requested is the
 * pre-confirmation phase; Confirmed → ship. Full ship → Dispatched (complete).
 * Settle (qty mismatch) → Settled (complete). Declined/Cancelled terminal.
 * Legacy `delivered` still read.
 */
export const OrderStatus = {
  Requested: 'requested',
  Confirmed: 'confirmed',
  /** Some qty shipped, some remains — main status (not a Confirmed cue). */
  PartShipped: 'part_shipped',
  Dispatched: 'dispatched',
  Delivered: 'delivered',
  Settled: 'settled',
  Declined: 'declined',
  Cancelled: 'cancelled',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];
export const orderStatusValues = values(OrderStatus);

/** A Photo Order shares the Order lifecycle; it is a variant entry point. */
export const OrderKind = {
  Standard: 'standard',
  Photo: 'photo',
} as const;
export type OrderKind = (typeof OrderKind)[keyof typeof OrderKind];
export const orderKindValues = values(OrderKind);

/** Dual-trade routing (Slice B). Upstream linked rows stay bilateral with downstreamOrderId. */
export const OrderTradeMode = {
  Bilateral: 'bilateral',
  Manage: 'manage',
  Direct: 'direct',
} as const;
export type OrderTradeMode = (typeof OrderTradeMode)[keyof typeof OrderTradeMode];
export const orderTradeModeValues = values(OrderTradeMode);

/**
 * Curator/share preference: who the buyer’s ticket is with.
 * Profile default + per forward/publish/curate override. Missing ⇒ Direct.
 */
export const OrderPathPreference = {
  Direct: 'direct',
  Handle: 'handle',
} as const;
export type OrderPathPreference =
  (typeof OrderPathPreference)[keyof typeof OrderPathPreference];
export const orderPathPreferenceValues = values(OrderPathPreference);

/** TradeLane ticket: who the end-buyer’s hop is with (Me = I handle). */
export const TradeLaneTicket = {
  Me: 'me',
  Mill: 'mill',
} as const;
export type TradeLaneTicket = (typeof TradeLaneTicket)[keyof typeof TradeLaneTicket];
export const tradeLaneTicketValues = values(TradeLaneTicket);

/**
 * Commitment level. Inquiry = rate ask (soft); becomes order when the seller
 * quotes / confirms lines or the buyer accepts a quote.
 */
export const OrderIntent = {
  Order: 'order',
  Inquiry: 'inquiry',
} as const;
export type OrderIntent = (typeof OrderIntent)[keyof typeof OrderIntent];
export const orderIntentValues = values(OrderIntent);

/** The perspective of a company on a shared Order. */
export const OrderDirection = {
  Buying: 'buying',
  Selling: 'selling',
} as const;
export type OrderDirection = (typeof OrderDirection)[keyof typeof OrderDirection];
export const orderDirectionValues = values(OrderDirection);

/**
 * Per-line outcome on an order. Order.status is a rollup of these lines
 * (plus whole-order decline/cancel).
 */
export const OrderLineStatus = {
  Open: 'open',
  Declined: 'declined',
  Confirmed: 'confirmed',
  Dispatched: 'dispatched',
  Delivered: 'delivered',
} as const;
export type OrderLineStatus = (typeof OrderLineStatus)[keyof typeof OrderLineStatus];
export const orderLineStatusValues = values(OrderLineStatus);

/** Samples map onto the same stages as orders rather than inventing vocabulary. */
export const SampleStatus = {
  Requested: 'requested',
  Dispatched: 'dispatched',
  Received: 'received',
  Declined: 'declined',
  Converted: 'converted',
} as const;
export type SampleStatus = (typeof SampleStatus)[keyof typeof SampleStatus];
export const sampleStatusValues = values(SampleStatus);

export const ReturnStatus = {
  Requested: 'requested',
  Approved: 'approved',
  PartiallyApproved: 'partially_approved',
  Declined: 'declined',
  Resolved: 'resolved',
} as const;
export type ReturnStatus = (typeof ReturnStatus)[keyof typeof ReturnStatus];
export const returnStatusValues = values(ReturnStatus);

export const ComplaintStatus = {
  Open: 'open',
  Responded: 'responded',
  Resolved: 'resolved',
} as const;
export type ComplaintStatus = (typeof ComplaintStatus)[keyof typeof ComplaintStatus];
export const complaintStatusValues = values(ComplaintStatus);

/** A thread supports direct (two-company) and group (trader + supplier + buyer). */
export const ThreadType = {
  Direct: 'direct',
  Group: 'group',
} as const;
export type ThreadType = (typeof ThreadType)[keyof typeof ThreadType];
export const threadTypeValues = values(ThreadType);

/** @deprecated Leftover DB values only. New chats are always shared; roster is ThreadMember. */
export const ThreadVisibility = {
  Shared: 'shared',
  OwnerOnly: 'owner_only',
} as const;
export type ThreadVisibility = (typeof ThreadVisibility)[keyof typeof ThreadVisibility];
export const threadVisibilityValues = values(ThreadVisibility);

/**
 * A company's standing in a thread. `pending` is the requests inbox: a first
 * message from a company you are not connected to lands here for accept/decline.
 * `archived` is silent — declined, left, or blocked threads never resurface.
 */
export const ThreadParticipantState = {
  Active: 'active',
  Pending: 'pending',
  Archived: 'archived',
} as const;
export type ThreadParticipantState =
  (typeof ThreadParticipantState)[keyof typeof ThreadParticipantState];
export const threadParticipantStateValues = values(ThreadParticipantState);

/** Per-thread notification level. Muting is local and never signalled to others. */
export const ThreadAlertLevel = {
  All: 'all',
  Muted: 'muted',
} as const;
export type ThreadAlertLevel = (typeof ThreadAlertLevel)[keyof typeof ThreadAlertLevel];
export const threadAlertLevelValues = values(ThreadAlertLevel);

/** A person on a thread. `left` still counts in group uniqueness; `removed` does not. */
export const ThreadMemberState = {
  Active: 'active',
  Left: 'left',
  Removed: 'removed',
} as const;
export type ThreadMemberState = (typeof ThreadMemberState)[keyof typeof ThreadMemberState];
export const threadMemberStateValues = values(ThreadMemberState);

/** Messages carry references (not copies) of shared trade objects. */
export const MessageType = {
  Text: 'text',
  Photo: 'photo',
  Voice: 'voice',
  CollectionCard: 'collection_card',
  ProductCard: 'product_card',
  OrderCard: 'order_card',
  Rate: 'rate',
  System: 'system',
  PaymentCard: 'payment_card',
} as const;
export type MessageType = (typeof MessageType)[keyof typeof MessageType];
export const messageTypeValues = values(MessageType);

export const NotificationType = {
  Order: 'order',
  Return: 'return',
  Request: 'request',
  Message: 'message',
  Collection: 'collection',
  Broadcast: 'broadcast',
  Complaint: 'complaint',
  Sample: 'sample',
  Digest: 'digest',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
export const notificationTypeValues = values(NotificationType);

export const PaymentRequestStatus = {
  Open: 'open',
  Paid: 'paid',
  Cancelled: 'cancelled',
} as const;
export type PaymentRequestStatus = (typeof PaymentRequestStatus)[keyof typeof PaymentRequestStatus];
export const paymentRequestStatusValues = values(PaymentRequestStatus);

/** Phase 1 broadcast sends immediately; scheduling/tiering is Phase 2. */
export const BroadcastStatus = {
  Sent: 'sent',
} as const;
export type BroadcastStatus = (typeof BroadcastStatus)[keyof typeof BroadcastStatus];
export const broadcastStatusValues = values(BroadcastStatus);

/** Media is uploaded direct-to-blob, then a worker derives a thumbnail. */
export const MediaKind = {
  Image: 'image',
  Audio: 'audio',
} as const;
export type MediaKind = (typeof MediaKind)[keyof typeof MediaKind];
export const mediaKindValues = values(MediaKind);

/**
 * A media object's lifecycle. `pending` = upload URL minted, bytes not confirmed;
 * `uploaded` = client confirmed the direct upload; `ready` = thumbnail derived;
 * `failed` = processing gave up after retries.
 */
export const MediaStatus = {
  Pending: 'pending',
  Uploaded: 'uploaded',
  Ready: 'ready',
  Failed: 'failed',
} as const;
export type MediaStatus = (typeof MediaStatus)[keyof typeof MediaStatus];
export const mediaStatusValues = values(MediaStatus);

/** The background job types processed by the Postgres-backed job runner. */
export const JobType = {
  MediaThumbnail: 'media.thumbnail',
  ReturnWindowExpire: 'return_window.expire',
  NotificationDigest: 'notification.digest',
  CollectionExpire: 'collection.expire',
} as const;
export type JobType = (typeof JobType)[keyof typeof JobType];
export const jobTypeValues = values(JobType);

export const JobStatus = {
  Pending: 'pending',
  Running: 'running',
  Done: 'done',
  Failed: 'failed',
} as const;
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];
export const jobStatusValues = values(JobStatus);

/**
 * Coarse "what do you deal in" chips collected at onboarding. Distinct from fine
 * sell/buy product categories (sarees, kurtis, …) which are added later.
 */
export const SuperCategory = {
  MensApparel: 'mens_apparel',
  WomensApparel: 'womens_apparel',
  HomeFurnishing: 'home_furnishing',
  Accessories: 'accessories',
  Others: 'others',
} as const;
export type SuperCategory = (typeof SuperCategory)[keyof typeof SuperCategory];
export const superCategoryValues = values(SuperCategory);

/** Human labels for onboarding/profile chips. */
export const SUPER_CATEGORY_LABEL: Record<SuperCategory, string> = {
  [SuperCategory.MensApparel]: "Men's apparel",
  [SuperCategory.WomensApparel]: "Women's apparel",
  [SuperCategory.HomeFurnishing]: 'Home Furnishing',
  [SuperCategory.Accessories]: 'Accessories',
  [SuperCategory.Others]: 'Others',
};
