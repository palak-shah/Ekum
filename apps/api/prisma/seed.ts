/**
 * Demo/dev seed mirroring the clickable prototype: two businesses (a Surat
 * supplier and a Jaipur retailer), a published collection, a permissionless
 * follow, an approved connection, two orders (one delivered, one requested), a
 * direct thread with a shared card, and a couple of notifications.
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
  OrderStatus,
  ProductStatus,
  SuperCategory,
  ThreadParticipantState,
  ThreadType,
  VerificationStatus,
} from '@ekum/domain-types';

const prisma = new PrismaClient();

const RAVI = 'seed-company-ravi';
const MEENA = 'seed-company-meena';
const U_RAVI = 'seed-user-ravi';
const U_MEENA = 'seed-user-meena';

async function main(): Promise<void> {
  // --- People -------------------------------------------------------------
  await prisma.user.upsert({
    where: { id: U_RAVI },
    create: { id: U_RAVI, phone: '+919800000001', name: 'Ravi' },
    update: { name: 'Ravi' },
  });
  await prisma.user.upsert({
    where: { id: U_MEENA },
    create: { id: U_MEENA, phone: '+919800000002', name: 'Meena' },
    update: { name: 'Meena' },
  });

  // --- Businesses ---------------------------------------------------------
  await prisma.company.upsert({
    where: { id: RAVI },
    create: {
      id: RAVI,
      name: 'Ravi',
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
      name: 'Ravi',
      canPublish: true,
      verification: VerificationStatus.GstVerified,
      buyCategories: ['Fabric'],
      superCategories: [SuperCategory.WomensApparel, SuperCategory.Accessories],
    },
  });
  await prisma.company.upsert({
    where: { id: MEENA },
    create: {
      id: MEENA,
      name: 'Meena',
      city: 'Jaipur',
      about: 'Multi-brand retail store.',
      buyCategories: ['Sarees', 'Dress Material'],
      superCategories: [SuperCategory.WomensApparel],
    },
    update: {
      name: 'Meena',
      superCategories: [SuperCategory.WomensApparel],
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
    where: { userId_companyId: { userId: U_MEENA, companyId: MEENA } },
    create: { id: 'seed-mem-meena', userId: U_MEENA, companyId: MEENA, role: 'owner' },
    update: {},
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
      images: ['https://picsum.photos/seed/banarasi/600/800'],
    },
    {
      id: 'seed-prod-2',
      name: 'Georgette Party Saree',
      sku: 'GEO-014',
      rate: 1290,
      unit: 'pc',
      categories: ['Sarees'],
      images: ['https://picsum.photos/seed/georgette/600/800'],
    },
    {
      id: 'seed-prod-3',
      name: 'Cotton Dress Material',
      sku: 'CDM-207',
      rate: 640,
      unit: 'set',
      categories: ['Dress Material'],
      images: ['https://picsum.photos/seed/cotton/600/800'],
    },
    {
      id: 'seed-prod-4',
      name: 'Kanjeevaram Classic',
      sku: 'KJV-088',
      rate: 5200,
      unit: 'pc',
      categories: ['Sarees'],
      images: ['https://picsum.photos/seed/kanjee/600/800'],
    },
    {
      id: 'seed-prod-5',
      name: 'Chiffon Evening Saree',
      sku: 'CHF-033',
      rate: 980,
      unit: 'pc',
      categories: ['Sarees'],
      images: ['https://picsum.photos/seed/chiffon/600/800'],
    },
    {
      id: 'seed-prod-6',
      name: 'Printed Salwar Set',
      sku: 'SLW-112',
      rate: 750,
      unit: 'set',
      categories: ['Salwar'],
      images: ['https://picsum.photos/seed/salwar/600/800'],
    },
    {
      id: 'seed-prod-7',
      name: 'Linen Summer Saree',
      sku: 'LIN-019',
      rate: 1100,
      unit: 'pc',
      categories: ['Sarees'],
      images: ['https://picsum.photos/seed/linen/600/800'],
    },
    {
      id: 'seed-prod-8',
      name: 'Organza Festive',
      sku: 'ORG-044',
      rate: 1680,
      unit: 'pc',
      categories: ['Sarees'],
      images: ['https://picsum.photos/seed/organza/600/800'],
    },
  ];
  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      create: { ...product, companyId: RAVI, status: ProductStatus.Published },
      update: {
        rate: product.rate,
        status: ProductStatus.Published,
        images: product.images,
        categories: product.categories,
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
      coverImage: 'https://picsum.photos/seed/wedding/800/600',
      status: CollectionStatus.Published,
    },
    update: {
      status: CollectionStatus.Published,
      coverImage: 'https://picsum.photos/seed/wedding/800/600',
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

  // --- Discovery & Trust --------------------------------------------------
  await prisma.follow.upsert({
    where: { followerCompanyId_followedCompanyId: { followerCompanyId: MEENA, followedCompanyId: RAVI } },
    create: { id: 'seed-follow-1', followerCompanyId: MEENA, followedCompanyId: RAVI },
    update: {},
  });
  await prisma.connection.upsert({
    where: { ownerCompanyId_viewerCompanyId: { ownerCompanyId: RAVI, viewerCompanyId: MEENA } },
    create: {
      id: 'seed-conn-1',
      ownerCompanyId: RAVI,
      viewerCompanyId: MEENA,
      status: ConnectionStatus.Active,
    },
    update: { status: ConnectionStatus.Active },
  });

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
            image: 'https://picsum.photos/seed/banarasi/600/800',
            quantity: 10,
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
          },
        ],
      },
    },
    update: { status: OrderStatus.Requested },
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
  const messages = [
    { id: 'seed-msg-1', senderCompanyId: MEENA, type: MessageType.Text, body: 'Hi Ravi, loved the new wedding edit!', referenceId: null },
    { id: 'seed-msg-2', senderCompanyId: RAVI, type: MessageType.CollectionCard, body: null, referenceId: 'seed-col-1' },
    { id: 'seed-msg-3', senderCompanyId: MEENA, type: MessageType.Text, body: 'Sending an order now.', referenceId: null },
  ];
  for (const message of messages) {
    await prisma.message.upsert({
      where: { id: message.id },
      create: { ...message, threadId: 'seed-thread-1' },
      update: { body: message.body },
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
      body: 'Meena placed an order request.',
      refType: 'order',
      refId: 'seed-order-2',
    },
    update: { body: 'Meena placed an order request.' },
  });
  await prisma.notification.upsert({
    where: { id: 'seed-notif-2' },
    create: {
      id: 'seed-notif-2',
      recipientCompanyId: MEENA,
      type: NotificationType.Order,
      title: 'Rates on your order',
      body: 'Ravi added rates — accept the quote to confirm.',
      refType: 'order',
      refId: 'seed-order-2',
    },
    update: {
      title: 'Rates on your order',
      body: 'Ravi added rates — accept the quote to confirm.',
    },
  });
  await prisma.notification.upsert({
    where: { id: 'seed-notif-3' },
    create: {
      id: 'seed-notif-3',
      recipientCompanyId: MEENA,
      type: NotificationType.Collection,
      title: 'New drop from Ravi',
      body: 'Wedding Edit 2026 is live.',
      refType: 'collection',
      refId: 'seed-col-1',
    },
    update: {
      title: 'New drop from Ravi',
      body: 'Wedding Edit 2026 is live.',
    },
  });

  console.log('Seed complete: 2 companies, 3 products, 1 collection, 2 orders, 1 thread.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
