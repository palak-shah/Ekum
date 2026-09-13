/**
 * Demo/dev seed mirroring the clickable prototype: two businesses (a Surat
 * supplier and a Jaipur retailer), a published collection, a permissionless
 * follow, an approved connection, four orders (two bilateral, one I-handle
 * pair), a direct thread with a shared card, and a couple of notifications.
 *
 * Idempotent: every row uses a stable `seed-*` id and is upserted, so running it
 * repeatedly converges to the same state without duplicating anything.
 *
 * Run with `pnpm --filter @ekum/api db:seed` (needs DATABASE_URL).
 */
import { PrismaClient } from '@prisma/client';
import {
  CollectionStatus,
  ConnectionStatus,
  MessageType,
  NotificationType,
  OrderKind,
  OrderLineStatus,
  OrderStatus,
  OrderTradeMode,
  ProductStatus,
  PublishAudience,
  SuperCategory,
  ThreadMemberState,
  ThreadParticipantState,
  ThreadType,
  VerificationStatus,
} from '@ekum/domain-types';
import { ensureSeedImages } from '../src/common/seed-media';

const prisma = new PrismaClient();

const RAVI = 'seed-company-ravi';
const MEENA = 'seed-company-meena';
/** Peer supplier so Ravi (who owns the main catalog) still has Explore posts. */
const KAVITA = 'seed-company-kavita';
const U_RAVI = 'seed-user-ravi';
const U_RAVI_STAFF = 'seed-user-ravi-staff';
const U_MEENA = 'seed-user-meena';
const U_KAVITA = 'seed-user-kavita';

const DEMO_PEOPLE = [
  { id: U_RAVI, phone: '+919800000001', last10: '9800000001', name: 'Ravi' },
  { id: U_RAVI_STAFF, phone: '+919800000004', last10: '9800000004', name: 'Amit' },
  { id: U_MEENA, phone: '+919800000002', last10: '9800000002', name: 'Meena' },
  { id: U_KAVITA, phone: '+919800000003', last10: '9800000003', name: 'Kavita' },
] as const;

/** Leftover OTP rows (91… without +) must not steal demo numbers. */
async function reclaimDemoPhones(): Promise<void> {
  const rows = await prisma.user.findMany({ select: { id: true, phone: true } });
  let n = 0;
  for (const row of rows) {
    const last10 = row.phone.replace(/\D/g, '').slice(-10);
    const demo = DEMO_PEOPLE.find((person) => person.last10 === last10);
    if (!demo || row.id === demo.id) continue;
    await prisma.user.update({
      where: { id: row.id },
      data: { phone: `+9198099${String(n).padStart(5, '0')}` },
    });
    n += 1;
  }
}

async function main(): Promise<void> {
  const img = await ensureSeedImages();

  await reclaimDemoPhones();

  // --- People -------------------------------------------------------------
  await prisma.user.upsert({
    where: { id: U_RAVI },
    create: { id: U_RAVI, phone: '+919800000001', name: 'Ravi' },
    update: { phone: '+919800000001', name: 'Ravi' },
  });
  // Staff on Surat Silk House — OTP +919800000004 (no uploads / payments).
  await prisma.user.upsert({
    where: { id: U_RAVI_STAFF },
    create: { id: U_RAVI_STAFF, phone: '+919800000004', name: 'Amit' },
    update: { phone: '+919800000004', name: 'Amit' },
  });
  await prisma.user.upsert({
    where: { id: U_MEENA },
    create: { id: U_MEENA, phone: '+919800000002', name: 'Meena' },
    update: { phone: '+919800000002', name: 'Meena' },
  });
  await prisma.user.upsert({
    where: { id: U_KAVITA },
    create: { id: U_KAVITA, phone: '+919800000003', name: 'Kavita' },
    update: { phone: '+919800000003', name: 'Kavita' },
  });

  // --- Businesses ---------------------------------------------------------
  // Person at +919800000001 stays "Ravi"; business names stay distinct so Explore
  // / chats / notifications are not a wall of the same label.
  await prisma.company.upsert({
    where: { id: RAVI },
    create: {
      id: RAVI,
      name: 'Surat Silk House',
      city: 'Surat',
      about: 'Wholesale sarees and dress material. Weekly new designs.',
      gstNumber: '24ABCDE1234F1Z5',
      verification: VerificationStatus.GstVerified,
      canPublish: true,
      canRefer: true,
      sellCategories: ['Sarees', 'Dress Material'],
      // Dual-role so Explore shows Buying / Selling scope for the supplier persona.
      buyCategories: ['Fabric'],
      superCategories: [SuperCategory.WomensApparel, SuperCategory.Accessories],
    },
    update: {
      name: 'Surat Silk House',
      canPublish: true,
      canRefer: true,
      verification: VerificationStatus.GstVerified,
      buyCategories: ['Fabric'],
      superCategories: [SuperCategory.WomensApparel, SuperCategory.Accessories],
    },
  });
  await prisma.company.upsert({
    where: { id: MEENA },
    create: {
      id: MEENA,
      name: 'Jaipur Emporium',
      city: 'Jaipur',
      about: 'Multi-brand retail store.',
      buyCategories: ['Sarees', 'Dress Material'],
      superCategories: [SuperCategory.WomensApparel],
      canRefer: true,
    },
    update: {
      name: 'Jaipur Emporium',
      canRefer: true,
      superCategories: [SuperCategory.WomensApparel],
    },
  });
  await prisma.company.upsert({
    where: { id: KAVITA },
    create: {
      id: KAVITA,
      name: 'Ahmedabad Loom Co',
      city: 'Ahmedabad',
      about: 'Grey fabric and lining for garment houses.',
      gstNumber: '24FGHIJ5678K1Z2',
      verification: VerificationStatus.GstVerified,
      canPublish: true,
      canRefer: true,
      sellCategories: ['Fabric'],
      buyCategories: ['Sarees'],
      superCategories: [SuperCategory.Accessories],
    },
    update: {
      name: 'Ahmedabad Loom Co',
      canPublish: true,
      canRefer: true,
      verification: VerificationStatus.GstVerified,
      sellCategories: ['Fabric'],
      buyCategories: ['Sarees'],
      superCategories: [SuperCategory.Accessories],
    },
  });

  await prisma.companyMembership.upsert({
    where: { userId_companyId: { userId: U_RAVI, companyId: RAVI } },
    create: {
      id: 'seed-mem-ravi',
      userId: U_RAVI,
      companyId: RAVI,
      role: 'owner',
      contactRole: 'Sales',
      showPhone: true,
      displayPhone: '+919800000001',
    },
    update: { showPhone: true, displayPhone: '+919800000001' },
  });
  await prisma.companyMembership.upsert({
    where: { userId_companyId: { userId: U_RAVI_STAFF, companyId: RAVI } },
    create: {
      id: 'seed-mem-ravi-staff',
      userId: U_RAVI_STAFF,
      companyId: RAVI,
      role: 'staff',
      contactRole: 'Sales assistant',
      canUploads: false,
      canChats: true,
      canOrders: true,
      canPayments: false,
      canTeam: false,
    },
    update: {
      role: 'staff',
      canUploads: false,
      canChats: true,
      canOrders: true,
      canPayments: false,
      canTeam: false,
    },
  });
  await prisma.companyMembership.upsert({
    where: { userId_companyId: { userId: U_MEENA, companyId: MEENA } },
    create: { id: 'seed-mem-meena', userId: U_MEENA, companyId: MEENA, role: 'owner' },
    update: {},
  });
  await prisma.companyMembership.upsert({
    where: { userId_companyId: { userId: U_KAVITA, companyId: KAVITA } },
    create: { id: 'seed-mem-kavita', userId: U_KAVITA, companyId: KAVITA, role: 'owner' },
    update: {},
  });

  await prisma.companySettings.upsert({
    where: { companyId: RAVI },
    create: {
      id: 'seed-settings-ravi',
      companyId: RAVI,
      tradeDefaults: { tradingEnabled: true },
    },
    update: {
      tradeDefaults: { tradingEnabled: true },
    },
  });

  // --- Catalogue ----------------------------------------------------------
  // Enough distinct images for a WhatsApp-style Explore collage (+N overlay).
  const products = [
    {
      id: 'seed-prod-1',
      name: 'Banarasi Silk Saree',
      sku: 'BNS-001',
      rate: 2450,
      unit: 'pc',
      categories: ['Sarees'],
      images: [img.banarasi],
    },
    {
      id: 'seed-prod-2',
      name: 'Georgette Party Saree',
      sku: 'GEO-014',
      rate: 1290,
      unit: 'pc',
      categories: ['Sarees'],
      images: [img.georgette],
    },
    {
      id: 'seed-prod-3',
      name: 'Cotton Dress Material',
      sku: 'CDM-207',
      rate: 640,
      unit: 'set',
      categories: ['Dress Material'],
      images: [img.cotton],
    },
    {
      id: 'seed-prod-4',
      name: 'Kanjeevaram Classic',
      sku: 'KJV-088',
      rate: 5200,
      unit: 'pc',
      categories: ['Sarees'],
      images: [img.kanjee],
    },
    {
      id: 'seed-prod-5',
      name: 'Chiffon Evening Saree',
      sku: 'CHF-033',
      rate: 980,
      unit: 'pc',
      categories: ['Sarees'],
      images: [img.chiffon],
    },
    {
      id: 'seed-prod-6',
      name: 'Printed Salwar Set',
      sku: 'SLW-112',
      rate: 750,
      unit: 'set',
      categories: ['Salwar'],
      images: [img.salwar],
    },
    {
      id: 'seed-prod-7',
      name: 'Linen Summer Saree',
      sku: 'LIN-019',
      rate: 1100,
      unit: 'pc',
      categories: ['Sarees'],
      images: [img.linen],
    },
    {
      id: 'seed-prod-8',
      name: 'Organza Festive',
      sku: 'ORG-044',
      rate: 1680,
      unit: 'pc',
      categories: ['Sarees'],
      images: [img.organza],
    },
    {
      id: 'seed-prod-no-image',
      name: 'Sample swatch (no photo)',
      sku: 'SWATCH-000',
      rate: 100,
      unit: 'pc',
      categories: ['Sarees'],
      images: [],
    },
  ];
  const postedAt = new Date();
  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      create: {
        ...product,
        companyId: RAVI,
        status: ProductStatus.Published,
        audience: PublishAudience.Everyone,
        allowForward: true,
        postedToMarketAt: postedAt,
      },
      update: {
        rate: product.rate,
        status: ProductStatus.Published,
        images: product.images,
        categories: product.categories,
        audience: PublishAudience.Everyone,
        allowForward: true,
        postedToMarketAt: postedAt,
      },
    });
  }

  await prisma.company.update({
    where: { id: RAVI },
    data: { sellCategories: ['Sarees', 'Dress Material', 'Salwar'] },
  });

  await prisma.collection.upsert({
    where: { id: 'seed-col-1' },
    create: {
      id: 'seed-col-1',
      companyId: RAVI,
      name: 'Wedding Edit 2026',
      description: 'Hand-picked bridal and festive designs.',
      coverImage: img.wedding,
      status: CollectionStatus.Published,
      audience: PublishAudience.Everyone,
      allowForward: true,
      exploreActivityAt: postedAt,
    },
    update: {
      status: CollectionStatus.Published,
      coverImage: img.wedding,
      audience: PublishAudience.Everyone,
      allowForward: true,
      exploreActivityAt: postedAt,
    },
  });
  const collectionProducts = products.map((product, index) => ({
    id: `seed-cp-${index + 1}`,
    productId: product.id,
    position: index,
  }));
  for (const cp of collectionProducts) {
    await prisma.collectionProduct.upsert({
      where: { collectionId_productId: { collectionId: 'seed-col-1', productId: cp.productId } },
      create: { id: cp.id, collectionId: 'seed-col-1', productId: cp.productId, position: cp.position },
      update: { position: cp.position },
    });
  }

  // Peer supplier catalog — gives Ravi Explore “New for you” / Stories / Businesses.
  const fabricProducts = [
    {
      id: 'seed-prod-fabric-1',
      name: 'Cotton Grey Fabric',
      sku: 'FAB-CO-01',
      rate: 85,
      unit: 'mtr',
      categories: ['Fabric'],
      images: [img.greyfabric],
    },
    {
      id: 'seed-prod-fabric-2',
      name: 'Soft Lining Roll',
      sku: 'FAB-LN-02',
      rate: 42,
      unit: 'mtr',
      categories: ['Fabric'],
      images: [img.lining],
    },
    {
      id: 'seed-prod-fabric-3',
      name: 'Georgette Base',
      sku: 'FAB-GEO-03',
      rate: 110,
      unit: 'mtr',
      categories: ['Fabric'],
      images: [img.geobase],
    },
  ];
  for (const product of fabricProducts) {
    await prisma.product.upsert({
      where: { id: product.id },
      create: {
        ...product,
        companyId: KAVITA,
        status: ProductStatus.Published,
        audience: PublishAudience.Everyone,
        allowForward: true,
        postedToMarketAt: postedAt,
      },
      update: {
        rate: product.rate,
        status: ProductStatus.Published,
        images: product.images,
        categories: product.categories,
        companyId: KAVITA,
        audience: PublishAudience.Everyone,
        allowForward: true,
        postedToMarketAt: postedAt,
      },
    });
  }
  await prisma.collection.upsert({
    where: { id: 'seed-col-fabric' },
    create: {
      id: 'seed-col-fabric',
      companyId: KAVITA,
      name: 'Mill Lot — March',
      description: 'Fresh grey and lining for garment houses.',
      coverImage: img.millot,
      status: CollectionStatus.Published,
      audience: PublishAudience.Everyone,
      allowForward: true,
      exploreActivityAt: postedAt,
    },
    update: {
      status: CollectionStatus.Published,
      coverImage: img.millot,
      audience: PublishAudience.Everyone,
      allowForward: true,
      exploreActivityAt: postedAt,
    },
  });
  for (const [index, product] of fabricProducts.entries()) {
    await prisma.collectionProduct.upsert({
      where: {
        collectionId_productId: { collectionId: 'seed-col-fabric', productId: product.id },
      },
      create: {
        id: `seed-cp-fabric-${index + 1}`,
        collectionId: 'seed-col-fabric',
        productId: product.id,
        position: index,
      },
      update: { position: index },
    });
  }

  // --- Discovery & Trust --------------------------------------------------
  await prisma.follow.upsert({
    where: { followerCompanyId_followedCompanyId: { followerCompanyId: MEENA, followedCompanyId: RAVI } },
    create: { id: 'seed-follow-1', followerCompanyId: MEENA, followedCompanyId: RAVI },
    update: {},
  });
  await prisma.follow.upsert({
    where: {
      followerCompanyId_followedCompanyId: { followerCompanyId: RAVI, followedCompanyId: KAVITA },
    },
    create: { id: 'seed-follow-2', followerCompanyId: RAVI, followedCompanyId: KAVITA },
    update: {},
  });
  {
    const [companyLowId, companyHighId] = RAVI < MEENA ? [RAVI, MEENA] : [MEENA, RAVI];
    await prisma.connection.upsert({
      where: { companyLowId_companyHighId: { companyLowId, companyHighId } },
      create: {
        id: 'seed-conn-1',
        companyLowId,
        companyHighId,
        status: ConnectionStatus.Active,
        statusSetByCompanyId: null,
      },
      update: { status: ConnectionStatus.Active, statusSetByCompanyId: null },
    });
  }

  // --- Orders -------------------------------------------------------------
  const delivered = new Date();
  await prisma.order.upsert({
    where: { id: 'seed-order-1' },
    create: {
      id: 'seed-order-1',
      kind: OrderKind.Standard,
      status: OrderStatus.Delivered,
      buyerCompanyId: MEENA,
      sellerCompanyId: RAVI,
      createdByCompanyId: MEENA,
      note: 'Please pack carefully.',
      confirmedAt: delivered,
      dispatchedAt: delivered,
      deliveredAt: delivered,
      returnWindowClosesAt: new Date(delivered.getTime() + 7 * 86_400_000),
      items: {
        create: [
          {
            id: 'seed-oi-1',
            productId: 'seed-prod-1',
            name: 'Banarasi Silk Saree',
            sku: 'BNS-001',
            rate: 2450,
            unit: 'pc',
            image: img.banarasi,
            quantity: 10,
            requestedQuantity: 10,
            lineStatus: OrderLineStatus.Delivered,
          },
        ],
      },
    },
    update: { status: OrderStatus.Delivered },
  });
  await prisma.order.upsert({
    where: { id: 'seed-order-2' },
    create: {
      id: 'seed-order-2',
      kind: OrderKind.Standard,
      status: OrderStatus.Requested,
      buyerCompanyId: MEENA,
      sellerCompanyId: RAVI,
      createdByCompanyId: MEENA,
      items: {
        create: [
          {
            id: 'seed-oi-2',
            productId: 'seed-prod-3',
            name: 'Cotton Dress Material',
            sku: 'CDM-207',
            rate: 640,
            unit: 'set',
            quantity: 25,
            requestedQuantity: 25,
            lineStatus: OrderLineStatus.Open,
          },
          {
            id: 'seed-oi-2b',
            productId: 'seed-prod-4',
            name: 'Kanjeevaram Classic',
            sku: 'KJV-088',
            rate: 5200,
            unit: 'pc',
            image: img.kanjee,
            quantity: 4,
            requestedQuantity: 4,
            lineStatus: OrderLineStatus.Open,
          },
        ],
      },
    },
    update: { status: OrderStatus.Requested },
  });
  // Ensure the walkthrough order has two open lines (upsert update path skips items).
  await prisma.orderItem.upsert({
    where: { id: 'seed-oi-2' },
    create: {
      id: 'seed-oi-2',
      orderId: 'seed-order-2',
      productId: 'seed-prod-3',
      name: 'Cotton Dress Material',
      sku: 'CDM-207',
      rate: 640,
      unit: 'set',
      quantity: 25,
      requestedQuantity: 25,
      lineStatus: OrderLineStatus.Open,
    },
    update: {
      quantity: 25,
      requestedQuantity: 25,
      lineStatus: OrderLineStatus.Open,
      rate: 640,
    },
  });
  await prisma.orderItem.upsert({
    where: { id: 'seed-oi-2b' },
    create: {
      id: 'seed-oi-2b',
      orderId: 'seed-order-2',
      productId: 'seed-prod-4',
      name: 'Kanjeevaram Classic',
      sku: 'KJV-088',
      rate: 5200,
      unit: 'pc',
      image: img.kanjee,
      quantity: 4,
      requestedQuantity: 4,
      lineStatus: OrderLineStatus.Open,
    },
    update: {
      quantity: 4,
      requestedQuantity: 4,
      lineStatus: OrderLineStatus.Open,
      rate: 5200,
      image: img.kanjee,
    },
  });
  await prisma.orderItem.update({
    where: { id: 'seed-oi-1' },
    data: {
      requestedQuantity: 10,
      lineStatus: OrderLineStatus.Delivered,
      image: img.banarasi,
    },
  });

  // I handle: Meena’s ticket is with Ravi; mill hop waits until Ravi Send.
  await prisma.order.upsert({
    where: { id: 'seed-order-handle-down' },
    create: {
      id: 'seed-order-handle-down',
      kind: OrderKind.Standard,
      status: OrderStatus.Requested,
      tradeMode: OrderTradeMode.Manage,
      buyerCompanyId: MEENA,
      sellerCompanyId: RAVI,
      createdByCompanyId: MEENA,
      note: 'I handle — mill lot',
      items: {
        create: [
          {
            id: 'seed-oi-handle-down-1',
            productId: 'seed-prod-fabric-1',
            name: 'Cotton Grey Fabric',
            sku: 'FAB-CO-01',
            rate: 85,
            unit: 'mtr',
            image: img.greyfabric,
            quantity: 50,
            requestedQuantity: 50,
            lineStatus: OrderLineStatus.Open,
          },
        ],
      },
    },
    update: {
      status: OrderStatus.Requested,
      tradeMode: OrderTradeMode.Manage,
      note: 'I handle — mill lot',
    },
  });
  await prisma.orderItem.upsert({
    where: { id: 'seed-oi-handle-down-1' },
    create: {
      id: 'seed-oi-handle-down-1',
      orderId: 'seed-order-handle-down',
      productId: 'seed-prod-fabric-1',
      name: 'Cotton Grey Fabric',
      sku: 'FAB-CO-01',
      rate: 85,
      unit: 'mtr',
      image: img.greyfabric,
      quantity: 50,
      requestedQuantity: 50,
      lineStatus: OrderLineStatus.Open,
    },
    update: {
      quantity: 50,
      requestedQuantity: 50,
      lineStatus: OrderLineStatus.Open,
      rate: 85,
      image: img.greyfabric,
    },
  });
  await prisma.order.upsert({
    where: { id: 'seed-order-handle-up' },
    create: {
      id: 'seed-order-handle-up',
      kind: OrderKind.Standard,
      status: OrderStatus.Requested,
      tradeMode: OrderTradeMode.Bilateral,
      buyerCompanyId: RAVI,
      sellerCompanyId: KAVITA,
      createdByCompanyId: RAVI,
      downstreamOrderId: 'seed-order-handle-down',
      upstreamReleasedAt: null,
      note: 'For order #HANDLE — mill lot',
      items: {
        create: [
          {
            id: 'seed-oi-handle-up-1',
            productId: 'seed-prod-fabric-1',
            name: 'Cotton Grey Fabric',
            sku: 'FAB-CO-01',
            rate: 85,
            unit: 'mtr',
            image: img.greyfabric,
            quantity: 50,
            requestedQuantity: 50,
            lineStatus: OrderLineStatus.Open,
          },
        ],
      },
    },
    update: {
      status: OrderStatus.Requested,
      tradeMode: OrderTradeMode.Bilateral,
      downstreamOrderId: 'seed-order-handle-down',
      upstreamReleasedAt: null,
      note: 'For order #HANDLE — mill lot',
    },
  });
  await prisma.orderItem.upsert({
    where: { id: 'seed-oi-handle-up-1' },
    create: {
      id: 'seed-oi-handle-up-1',
      orderId: 'seed-order-handle-up',
      productId: 'seed-prod-fabric-1',
      name: 'Cotton Grey Fabric',
      sku: 'FAB-CO-01',
      rate: 85,
      unit: 'mtr',
      image: img.greyfabric,
      quantity: 50,
      requestedQuantity: 50,
      lineStatus: OrderLineStatus.Open,
    },
    update: {
      quantity: 50,
      requestedQuantity: 50,
      lineStatus: OrderLineStatus.Open,
      rate: 85,
      image: img.greyfabric,
    },
  });

  // --- Conversation -------------------------------------------------------
  await prisma.thread.upsert({
    where: { id: 'seed-thread-1' },
    create: {
      id: 'seed-thread-1',
      type: ThreadType.Direct,
      createdByCompanyId: MEENA,
      lastMessageAt: new Date(),
    },
    update: {},
  });
  const participants = [
    { id: 'seed-tp-1', companyId: MEENA },
    { id: 'seed-tp-2', companyId: RAVI },
  ];
  for (const participant of participants) {
    await prisma.threadParticipant.upsert({
      where: { threadId_companyId: { threadId: 'seed-thread-1', companyId: participant.companyId } },
      create: {
        id: participant.id,
        threadId: 'seed-thread-1',
        companyId: participant.companyId,
        state: ThreadParticipantState.Active,
      },
      update: { state: ThreadParticipantState.Active },
    });
  }
  // Chat access is ThreadMember (not only company participant).
  const seedMembers = [
    { id: 'seed-tm-meena', userId: U_MEENA, companyId: MEENA },
    { id: 'seed-tm-ravi', userId: U_RAVI, companyId: RAVI },
  ];
  for (const member of seedMembers) {
    await prisma.threadMember.upsert({
      where: { threadId_userId: { threadId: 'seed-thread-1', userId: member.userId } },
      create: {
        id: member.id,
        threadId: 'seed-thread-1',
        userId: member.userId,
        companyId: member.companyId,
        state: ThreadMemberState.Active,
      },
      update: { state: ThreadMemberState.Active, leftAt: null, companyId: member.companyId },
    });
  }
  const messages = [
    {
      id: 'seed-msg-1',
      senderCompanyId: MEENA,
      senderUserId: U_MEENA,
      senderName: 'Meena',
      type: MessageType.Text,
      body: 'Hi Ravi, loved the new wedding edit!',
      referenceId: null,
    },
    {
      id: 'seed-msg-2',
      senderCompanyId: RAVI,
      senderUserId: U_RAVI,
      senderName: 'Ravi',
      type: MessageType.CollectionCard,
      body: null,
      referenceId: 'seed-col-1',
    },
    {
      id: 'seed-msg-3',
      senderCompanyId: MEENA,
      senderUserId: U_MEENA,
      senderName: 'Meena',
      type: MessageType.Text,
      body: 'Sending an order now.',
      referenceId: null,
    },
    {
      id: 'seed-msg-handle-order',
      senderCompanyId: MEENA,
      senderUserId: U_MEENA,
      senderName: 'Meena',
      type: MessageType.OrderCard,
      body: null,
      referenceId: 'seed-order-handle-down',
    },
  ];
  for (const message of messages) {
    await prisma.message.upsert({
      where: { id: message.id },
      create: { ...message, threadId: 'seed-thread-1' },
      update: {
        body: message.body,
        senderUserId: message.senderUserId,
        senderName: message.senderName,
        type: message.type,
        referenceId: message.referenceId,
      },
    });
  }

  // --- Notifications ------------------------------------------------------
  await prisma.notification.upsert({
    where: { id: 'seed-notif-1' },
    create: {
      id: 'seed-notif-1',
      recipientCompanyId: RAVI,
      type: NotificationType.Order,
      title: 'New order request',
      body: 'Jaipur Emporium placed an order request.',
      refType: 'order',
      refId: 'seed-order-2',
    },
    update: { body: 'Jaipur Emporium placed an order request.' },
  });
  await prisma.notification.upsert({
    where: { id: 'seed-notif-2' },
    create: {
      id: 'seed-notif-2',
      recipientCompanyId: MEENA,
      type: NotificationType.Order,
      title: 'Rates on your order',
      body: 'Surat Silk House added rates — accept the quote to confirm.',
      refType: 'order',
      refId: 'seed-order-2',
    },
    update: {
      title: 'Rates on your order',
      body: 'Surat Silk House added rates — accept the quote to confirm.',
    },
  });
  await prisma.notification.upsert({
    where: { id: 'seed-notif-3' },
    create: {
      id: 'seed-notif-3',
      recipientCompanyId: MEENA,
      type: NotificationType.Collection,
      title: 'New drop from Surat Silk House',
      body: 'Wedding Edit 2026 is live.',
      refType: 'collection',
      refId: 'seed-col-1',
    },
    update: {
      title: 'New drop from Surat Silk House',
      body: 'Wedding Edit 2026 is live.',
    },
  });

  console.log(
    'Seed complete: 3 companies (Ravi, Meena, Kavita), catalog, follows, 4 orders (I-handle pair held), 1 thread.',
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
