import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const FROM = 'http://localhost:3000';
const TO = 'http://127.0.0.1:3000';

function rewrite(value: string | null | undefined): string | null {
  if (!value) return value ?? null;
  return value.includes(FROM) ? value.split(FROM).join(TO) : value;
}

async function main() {
  const products = await prisma.product.findMany({ select: { id: true, images: true } });
  let productUpdates = 0;
  for (const row of products) {
    const next = row.images.map((url) => rewrite(url) ?? url);
    if (next.some((url, i) => url !== row.images[i])) {
      await prisma.product.update({ where: { id: row.id }, data: { images: next } });
      productUpdates += 1;
    }
  }

  const collections = await prisma.collection.findMany({
    select: { id: true, coverImage: true },
  });
  let collectionUpdates = 0;
  for (const row of collections) {
    const next = rewrite(row.coverImage);
    if (next !== row.coverImage) {
      await prisma.collection.update({
        where: { id: row.id },
        data: { coverImage: next },
      });
      collectionUpdates += 1;
    }
  }

  const companies = await prisma.company.findMany({ select: { id: true, logoUrl: true } });
  let companyUpdates = 0;
  for (const row of companies) {
    const next = rewrite(row.logoUrl);
    if (next !== row.logoUrl) {
      await prisma.company.update({ where: { id: row.id }, data: { logoUrl: next } });
      companyUpdates += 1;
    }
  }

  const orderItems = await prisma.orderItem.findMany({
    select: { id: true, image: true, images: true },
  });
  let orderItemUpdates = 0;
  for (const row of orderItems) {
    const image = rewrite(row.image);
    const images = row.images.map((url) => rewrite(url) ?? url);
    const changed =
      image !== row.image || images.some((url, i) => url !== row.images[i]);
    if (changed) {
      await prisma.orderItem.update({
        where: { id: row.id },
        data: { image, images },
      });
      orderItemUpdates += 1;
    }
  }

  const mediaRows = await prisma.media.findMany({
    select: { id: true, url: true, thumbnailUrl: true },
  });
  let mediaUpdates = 0;
  for (const row of mediaRows) {
    const url = rewrite(row.url) ?? row.url;
    const thumbnailUrl = rewrite(row.thumbnailUrl);
    if (url !== row.url || thumbnailUrl !== row.thumbnailUrl) {
      await prisma.media.update({
        where: { id: row.id },
        data: { url, thumbnailUrl },
      });
      mediaUpdates += 1;
    }
  }

  console.log(
    JSON.stringify({
      productUpdates,
      collectionUpdates,
      companyUpdates,
      orderItemUpdates,
      mediaUpdates,
    }),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
