import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CollectionStatus,
  ProductStatus,
  type CreateShareLinkDto,
  type ShareLinkDesignPreview,
  type ShareLinkView,
} from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { randomToken } from '../common/crypto.util';
import { shareLinkOpenForCollection, shareLinkOpenForProduct } from './share-link-view';

const TTL_MS = 48 * 60 * 60 * 1000;

@Injectable()
export class ShareLinkService {
  constructor(private readonly prisma: PrismaService) {}

  async create(actorCompanyId: string, dto: CreateShareLinkDto): Promise<ShareLinkView> {
    if (dto.collectionId) {
      const collection = await this.prisma.collection.findUnique({
        where: { id: dto.collectionId },
      });
      if (!collection) {
        throw new NotFoundException({ code: 'NOT_FOUND', message: 'Collection not found.' });
      }
      this.assertShareable(
        actorCompanyId,
        collection.companyId,
        collection.status === CollectionStatus.Published,
      );
      const token = await this.insertToken('collection', collection.id, actorCompanyId);
      return this.get(token);
    }

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Design not found.' });
    }
    this.assertShareable(
      actorCompanyId,
      product.companyId,
      product.status === ProductStatus.Published || Boolean(product.postedToMarketAt),
    );
    const token = await this.insertToken('product', product.id, actorCompanyId);
    return this.get(token);
  }

  async get(token: string): Promise<ShareLinkView> {
    const row = await this.prisma.catalogShareLink.findUnique({ where: { token } });
    if (!row || row.expiresAt.getTime() < Date.now()) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'This link has expired.' });
    }
    if (row.collectionId) {
      const collection = await this.prisma.collection.findUnique({
        where: { id: row.collectionId },
        select: {
          id: true,
          name: true,
          coverImage: true,
          audience: true,
          status: true,
          startsAt: true,
          endsAt: true,
          company: { select: { name: true } },
        },
      });
      if (!collection) {
        throw new NotFoundException({ code: 'NOT_FOUND', message: 'This link has expired.' });
      }
      const open = shareLinkOpenForCollection(collection);
      const designs = open ? await this.collectionDesigns(collection.id) : [];
      return {
        token,
        kind: 'collection',
        targetId: collection.id,
        name: collection.name,
        companyName: collection.company.name,
        image: collection.coverImage,
        audience: collection.audience,
        open,
        designs,
        expired: false,
        path: `/s/${token}`,
      };
    }
    if (row.productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: row.productId },
        select: {
          id: true,
          name: true,
          images: true,
          audience: true,
          status: true,
          postedToMarketAt: true,
          company: { select: { name: true } },
        },
      });
      if (!product) {
        throw new NotFoundException({ code: 'NOT_FOUND', message: 'This link has expired.' });
      }
      const open = shareLinkOpenForProduct(product);
      const thumb = product.images[0] ?? null;
      const designs: ShareLinkDesignPreview[] = open
        ? [{ id: product.id, name: product.name, image: thumb }]
        : [];
      return {
        token,
        kind: 'product',
        targetId: product.id,
        name: product.name,
        companyName: product.company.name,
        image: thumb,
        audience: product.audience,
        open,
        designs,
        expired: false,
        path: `/s/${token}`,
      };
    }
    throw new NotFoundException({ code: 'NOT_FOUND', message: 'This link has expired.' });
  }

  /**
   * Up to 4 design thumbs for WhatsApp OG — even when the pack is closed
   * (tease only; SPA `get()` still hides designs when `!open`).
   */
  async teaserImagePaths(token: string): Promise<{ paths: string[]; companyName: string }> {
    const view = await this.get(token);
    const row = await this.prisma.catalogShareLink.findUnique({ where: { token } });
    if (!row) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'This link has expired.' });
    }
    if (row.collectionId) {
      const designs = await this.collectionDesigns(row.collectionId);
      const paths = designs
        .map((d) => d.image)
        .filter((p): p is string => Boolean(p))
        .slice(0, 4);
      if (paths.length === 0 && view.image) paths.push(view.image);
      return { paths, companyName: view.companyName };
    }
    const paths = view.image ? [view.image] : [];
    return { paths, companyName: view.companyName };
  }

  async buildOgImageJpeg(token: string, mediaBase: string): Promise<Buffer> {
    const { buildShareLinkOgJpeg } = await import('./share-link-og-image');
    const { absoluteMediaUrl } = await import('./share-link-og');
    const { paths, companyName } = await this.teaserImagePaths(token);
    const buffers: Buffer[] = [];
    for (const path of paths) {
      const url = absoluteMediaUrl(path, mediaBase);
      if (!url) continue;
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        buffers.push(Buffer.from(await res.arrayBuffer()));
      } catch {
        /* skip bad thumb */
      }
    }
    return buildShareLinkOgJpeg({ imageBuffers: buffers, sellerLabel: companyName });
  }

  private async collectionDesigns(collectionId: string): Promise<ShareLinkDesignPreview[]> {
    const rows = await this.prisma.collectionProduct.findMany({
      where: { collectionId },
      orderBy: { position: 'asc' },
      select: {
        product: { select: { id: true, name: true, images: true } },
      },
    });
    return rows.map((row) => ({
      id: row.product.id,
      name: row.product.name,
      image: row.product.images[0] ?? null,
    }));
  }

  private assertShareable(
    actorCompanyId: string,
    ownerCompanyId: string,
    published: boolean,
  ) {
    if (actorCompanyId === ownerCompanyId) return;
    if (!published) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Not found.' });
    }
  }

  private async insertToken(
    kind: 'collection' | 'product',
    targetId: string,
    createdByCompanyId: string,
  ): Promise<string> {
    const token = randomToken(18);
    await this.prisma.catalogShareLink.create({
      data: {
        token,
        collectionId: kind === 'collection' ? targetId : null,
        productId: kind === 'product' ? targetId : null,
        createdByCompanyId,
        expiresAt: new Date(Date.now() + TTL_MS),
      },
    });
    return token;
  }
}
