/**
 * Demo/dev seed mirroring the clickable prototype: two businesses (a Surat
 * supplier and a Jaipur retailer), a published collection, a permissionless
 * follow (Followers-audience catalog), approved connections, four orders (two bilateral, one I-handle
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
  RateVisibility,
  SuperCategory,
  ThreadMemberState,
  ThreadParticipantState,
  ThreadType,
  VerificationStatus,
} from '@ekum/domain-types';
import { ensureSeedImages } from '../src/common/seed-media';
import { seedOfficialCatalogTags } from '../src/catalog/official-tags.seed';

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
  await prisma.companySettings.upsert({
    where: { companyId: KAVITA },
    create: {
      id: 'seed-settings-kavita',
      companyId: KAVITA,
      tradeDefaults: { tradingEnabled: true },
    },
    update: {
      tradeDefaults: { tradingEnabled: true },
    },
  });

  const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000);

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
        audience: PublishAudience.Followers,
        allowForward: true,
        postedToMarketAt: postedAt,
      },
      update: {
        rate: product.rate,
        status: ProductStatus.Published,
        images: product.images,
        categories: product.categories,
        audience: PublishAudience.Followers,
        allowForward: true,
        postedToMarketAt: postedAt,
      },
    });
  }

  await prisma.company.update({
    where: { id: RAVI },
    data: { sellCategories: ['Sarees', 'Dress Material', 'Salwar'] },
  });

  // Newest members first — mosaic shows the 3 just-added designs; About names them.
  const weddingMemberOrder = [
    'seed-prod-7', // Linen Summer Saree — new
    'seed-prod-8', // Organza Festive — new
    'seed-prod-5', // Chiffon Evening Saree — new
    'seed-prod-1',
    'seed-prod-2',
    'seed-prod-3',
    'seed-prod-4',
    'seed-prod-6',
    'seed-prod-no-image',
  ] as const;
  const weddingAbout = [
    'Bridal and festive picks for the season.',
    '',
    'Just added (3):',
    '· Linen Summer Saree',
    '· Organza Festive',
    '· Chiffon Evening Saree',
    '',
    'Open the pack to view each design.',
  ].join('\n');
  await prisma.collection.upsert({
    where: { id: 'seed-col-1' },
    create: {
      id: 'seed-col-1',
      companyId: RAVI,
      name: 'Wedding Edit 2026',
      description: weddingAbout,
      coverImage: img.wedding,
      categories: ['Sarees', 'Bridal'],
      status: CollectionStatus.Published,
      audience: PublishAudience.Followers,
      rateVisibility: RateVisibility.OnRequest,
      allowForward: true,
      exploreActivityAt: hoursAgo(1),
      exploreNewDesignCount: 3,
    },
    update: {
      name: 'Wedding Edit 2026',
      description: weddingAbout,
      status: CollectionStatus.Published,
      coverImage: img.wedding,
      categories: ['Sarees', 'Bridal'],
      audience: PublishAudience.Followers,
      rateVisibility: RateVisibility.OnRequest,
      allowForward: true,
      exploreActivityAt: hoursAgo(1),
      exploreNewDesignCount: 3,
    },
  });
  for (const [index, productId] of weddingMemberOrder.entries()) {
    await prisma.collectionProduct.upsert({
      where: { collectionId_productId: { collectionId: 'seed-col-1', productId } },
      create: {
        id: `seed-cp-wedding-${index + 1}`,
        collectionId: 'seed-col-1',
        productId,
        position: index,
      },
      update: { position: index },
    });
  }

  // Own-feed pack with a teal rate band (all /pc).
  const raviDailyIds = ['seed-prod-1', 'seed-prod-2', 'seed-prod-4', 'seed-prod-5'] as const;
  const dailyAbout =
    'Everyday sarees with honest piece rates.\n\nBanarasi · Georgette · Kanjeevaram · Chiffon — tap a design for photos.';
  await prisma.collection.upsert({
    where: { id: 'seed-col-ravi-daily' },
    create: {
      id: 'seed-col-ravi-daily',
      companyId: RAVI,
      name: 'Saree Daily',
      description: dailyAbout,
      coverImage: img.banarasi,
      categories: ['Sarees'],
      status: CollectionStatus.Published,
      audience: PublishAudience.Followers,
      rateVisibility: RateVisibility.Visible,
      allowForward: true,
      exploreActivityAt: hoursAgo(20),
      exploreNewDesignCount: 0,
    },
    update: {
      name: 'Saree Daily',
      description: dailyAbout,
      coverImage: img.banarasi,
      categories: ['Sarees'],
      status: CollectionStatus.Published,
      audience: PublishAudience.Followers,
      rateVisibility: RateVisibility.Visible,
      allowForward: true,
      exploreActivityAt: hoursAgo(20),
      exploreNewDesignCount: 0,
    },
  });
  for (const [index, productId] of raviDailyIds.entries()) {
    await prisma.collectionProduct.upsert({
      where: {
        collectionId_productId: { collectionId: 'seed-col-ravi-daily', productId },
      },
      create: {
        id: `seed-cp-ravi-daily-${index + 1}`,
        collectionId: 'seed-col-ravi-daily',
        productId,
        position: index,
      },
      update: { position: index },
    });
  }

  // Peer supplier catalog — client-like Explore feed for Ravi (Stories + mosaics + rates).
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
    {
      id: 'seed-prod-fabric-4',
      name: 'Silk Loom Cut',
      sku: 'FAB-SL-04',
      rate: 195,
      unit: 'mtr',
      categories: ['Fabric'],
      images: [img.banarasi],
    },
    {
      id: 'seed-prod-fabric-5',
      name: 'Chiffon Roll',
      sku: 'FAB-CH-05',
      rate: 128,
      unit: 'mtr',
      categories: ['Fabric'],
      images: [img.chiffon],
    },
    {
      id: 'seed-prod-fabric-6',
      name: 'Organza Base',
      sku: 'FAB-OR-06',
      rate: 160,
      unit: 'mtr',
      categories: ['Fabric'],
      images: [img.organza],
    },
    {
      id: 'seed-prod-fabric-7',
      name: 'Linen Mill Cloth',
      sku: 'FAB-LN-07',
      rate: 98,
      unit: 'mtr',
      categories: ['Fabric'],
      images: [img.linen],
    },
    {
      id: 'seed-prod-fabric-8',
      name: 'Georgette Party Cut',
      sku: 'FAB-GP-08',
      rate: 145,
      unit: 'mtr',
      categories: ['Fabric'],
      images: [img.georgette],
    },
  ];
  for (const product of fabricProducts) {
    await prisma.product.upsert({
      where: { id: product.id },
      create: {
        ...product,
        companyId: KAVITA,
        status: ProductStatus.Published,
        audience: PublishAudience.Followers,
        rateVisibility: RateVisibility.Visible,
        allowForward: true,
        postedToMarketAt: hoursAgo(6),
      },
      update: {
        rate: product.rate,
        status: ProductStatus.Published,
        images: product.images,
        categories: product.categories,
        companyId: KAVITA,
        audience: PublishAudience.Followers,
        rateVisibility: RateVisibility.Visible,
        allowForward: true,
        postedToMarketAt: hoursAgo(6),
      },
    });
  }

  type ExplorePackSeed = {
    id: string;
    name: string;
    description: string;
    coverImage: string;
    categories: string[];
    rateVisibility: string;
    exploreActivityAt: Date;
    exploreNewDesignCount: number;
    productIds: string[];
  };

  const kavitaNewCutAbout = [
    'Fresh mill rolls for garment houses. Rates visible.',
    '',
    'Just added (4):',
    '· Chiffon Roll',
    '· Organza Base',
    '· Linen Mill Cloth',
    '· Georgette Party Cut',
    '',
    'Open the pack to view each design.',
  ].join('\n');
  const kavitaPacks: ExplorePackSeed[] = [
    {
      id: 'seed-col-fabric',
      name: 'Mill Lot — March',
      description:
        'Fresh grey and lining for garment houses.\n\nCotton Grey · Soft Lining · Georgette Base — open any design for photos and rate.',
      coverImage: img.millot,
      categories: ['Fabric'],
      rateVisibility: RateVisibility.Visible,
      exploreActivityAt: hoursAgo(40),
      exploreNewDesignCount: 0,
      productIds: ['seed-prod-fabric-1', 'seed-prod-fabric-2', 'seed-prod-fabric-3'],
    },
    {
      id: 'seed-col-kavita-festive',
      name: 'Festive Loom Cut',
      description:
        'Bright cuts for festive sets.\n\nSilk Loom · Chiffon · Organza · Linen · Georgette — tap a design inside the pack.',
      coverImage: img.organza,
      categories: ['Fabric', 'Festive'],
      rateVisibility: RateVisibility.Visible,
      exploreActivityAt: hoursAgo(14),
      exploreNewDesignCount: 0,
      productIds: [
        'seed-prod-fabric-4',
        'seed-prod-fabric-5',
        'seed-prod-fabric-6',
        'seed-prod-fabric-7',
        'seed-prod-fabric-8',
      ],
    },
    {
      id: 'seed-col-kavita-newcut',
      name: 'New Cut — This week',
      description: kavitaNewCutAbout,
      coverImage: img.greyfabric,
      categories: ['Fabric'],
      rateVisibility: RateVisibility.Visible,
      exploreActivityAt: hoursAgo(0.5),
      exploreNewDesignCount: 4,
      // New four first so mosaic / pack list lead with what About names.
      productIds: [
        'seed-prod-fabric-5',
        'seed-prod-fabric-6',
        'seed-prod-fabric-7',
        'seed-prod-fabric-8',
        'seed-prod-fabric-1',
        'seed-prod-fabric-3',
      ],
    },
  ];

  for (const pack of kavitaPacks) {
    await prisma.collection.upsert({
      where: { id: pack.id },
      create: {
        id: pack.id,
        companyId: KAVITA,
        name: pack.name,
        description: pack.description,
        coverImage: pack.coverImage,
        categories: pack.categories,
        status: CollectionStatus.Published,
        audience: PublishAudience.Followers,
        rateVisibility: pack.rateVisibility,
        allowForward: true,
        exploreActivityAt: pack.exploreActivityAt,
        exploreNewDesignCount: pack.exploreNewDesignCount,
      },
      update: {
        name: pack.name,
        description: pack.description,
        coverImage: pack.coverImage,
        categories: pack.categories,
        status: CollectionStatus.Published,
        audience: PublishAudience.Followers,
        rateVisibility: pack.rateVisibility,
        allowForward: true,
        exploreActivityAt: pack.exploreActivityAt,
        exploreNewDesignCount: pack.exploreNewDesignCount,
      },
    });
    for (const [index, productId] of pack.productIds.entries()) {
      await prisma.collectionProduct.upsert({
        where: {
          collectionId_productId: { collectionId: pack.id, productId },
        },
        create: {
          id: `seed-cp-${pack.id}-${index + 1}`,
          collectionId: pack.id,
          productId,
          position: index,
        },
        update: { position: index },
      });
    }
  }

  // Solo Explore design tile (not only-in-pack).
  await prisma.product.upsert({
    where: { id: 'seed-prod-kavita-solo' },
    create: {
      id: 'seed-prod-kavita-solo',
      companyId: KAVITA,
      name: 'Sample Grey Swatch',
      sku: 'FAB-SW-09',
      rate: 55,
      unit: 'mtr',
      categories: ['Fabric'],
      images: [img.millot, img.greyfabric],
      status: ProductStatus.Published,
      audience: PublishAudience.Followers,
      rateVisibility: RateVisibility.Visible,
      allowForward: true,
      postedToMarketAt: hoursAgo(5),
    },
    update: {
      name: 'Sample Grey Swatch',
      rate: 55,
      images: [img.millot, img.greyfabric],
      status: ProductStatus.Published,
      audience: PublishAudience.Followers,
      rateVisibility: RateVisibility.Visible,
      allowForward: true,
      postedToMarketAt: hoursAgo(5),
    },
  });

  // --- Discovery & Trust --------------------------------------------------
  await prisma.follow.upsert({
    where: { followerCompanyId_followedCompanyId: { followerCompanyId: MEENA, followedCompanyId: RAVI } },
    create: {
      id: 'seed-follow-1',
      followerCompanyId: MEENA,
      followedCompanyId: RAVI,
      status: 'allowed',
      accessKind: 'look',
    },
    update: { status: 'allowed', accessKind: 'look' },
  });
  await prisma.follow.upsert({
    where: {
      followerCompanyId_followedCompanyId: { followerCompanyId: RAVI, followedCompanyId: KAVITA },
    },
    create: {
      id: 'seed-follow-2',
      followerCompanyId: RAVI,
      followedCompanyId: KAVITA,
      status: 'allowed',
      accessKind: 'look',
    },
    update: { status: 'allowed', accessKind: 'look' },
  });
  await prisma.follow.upsert({
    where: {
      followerCompanyId_followedCompanyId: { followerCompanyId: MEENA, followedCompanyId: KAVITA },
    },
    create: {
      id: 'seed-follow-meena-kavita',
      followerCompanyId: MEENA,
      followedCompanyId: KAVITA,
      status: 'allowed',
      accessKind: 'look',
    },
    update: { status: 'allowed', accessKind: 'look' },
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
  {
    const [companyLowId, companyHighId] = RAVI < KAVITA ? [RAVI, KAVITA] : [KAVITA, RAVI];
    await prisma.connection.upsert({
      where: { companyLowId_companyHighId: { companyLowId, companyHighId } },
      create: {
        id: 'seed-conn-ravi-kavita',
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

  await prisma.thread.upsert({
    where: { id: 'seed-group-1' },
    create: {
      id: 'seed-group-1',
      type: ThreadType.Group,
      title: 'Wedding circle',
      blurb: 'Rates and pcs for wedding lots',
      createdByCompanyId: MEENA,
      lastMessageAt: new Date(),
    },
    update: { title: 'Wedding circle', blurb: 'Rates and pcs for wedding lots' },
  });
  for (const row of [
    { id: 'seed-gtp-meena', companyId: MEENA },
    { id: 'seed-gtp-ravi', companyId: RAVI },
  ]) {
    await prisma.threadParticipant.upsert({
      where: { threadId_companyId: { threadId: 'seed-group-1', companyId: row.companyId } },
      create: {
        id: row.id,
        threadId: 'seed-group-1',
        companyId: row.companyId,
        state: ThreadParticipantState.Active,
      },
      update: { state: ThreadParticipantState.Active, leftAt: null },
    });
  }
  for (const row of [
    { id: 'seed-gtm-meena', userId: U_MEENA, companyId: MEENA },
    { id: 'seed-gtm-ravi', userId: U_RAVI, companyId: RAVI },
  ]) {
    await prisma.threadMember.upsert({
      where: { threadId_userId: { threadId: 'seed-group-1', userId: row.userId } },
      create: {
        id: row.id,
        threadId: 'seed-group-1',
        userId: row.userId,
        companyId: row.companyId,
        state: ThreadMemberState.Active,
      },
      update: { state: ThreadMemberState.Active, leftAt: null, companyId: row.companyId },
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

  const tagCount = await seedOfficialCatalogTags(prisma);

  console.log(
    `Seed complete: 3 companies (Ravi, Meena, Kavita), catalog, follows, 4 orders (I-handle pair held), 1 thread, ${tagCount} official tags.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
