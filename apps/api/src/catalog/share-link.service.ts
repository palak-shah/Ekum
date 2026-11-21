import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CollectionStatus,
  ProductStatus,
  designAlbumCaption,
  type CreateShareLinkDto,
  type ShareLinkClaimView,
  type ShareLinkDesignPreview,
  type ShareLinkView,
} from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { randomToken } from '../common/crypto.util';
import { resolveBuyerRepostPackAvailability } from './load-upstream-packs';
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
      const token = await this.insertToken({
        kind: 'collection',
        targetId: collection.id,
        createdByCompanyId: actorCompanyId,
      });
      return this.get(token);
    }

    if (dto.productIds && dto.productIds.length >= 2) {
      const seen = new Set<string>();
      const productIds: string[] = [];
      for (const id of dto.productIds) {
        if (seen.has(id)) continue;
        seen.add(id);
        productIds.push(id);
      }
      if (productIds.length < 2) {
        throw new NotFoundException({ code: 'NOT_FOUND', message: 'Pick at least 2 designs.' });
      }
      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          companyId: true,
          status: true,
          postedToMarketAt: true,
        },
      });
      const byId = new Map(products.map((row) => [row.id, row]));
      for (const id of productIds) {
        const product = byId.get(id);
        if (!product) {
          throw new NotFoundException({ code: 'NOT_FOUND', message: 'Design not found.' });
        }
        this.assertShareable(
          actorCompanyId,
          product.companyId,
          product.status === ProductStatus.Published || Boolean(product.postedToMarketAt),
        );
      }
      const token = await this.insertToken({
        kind: 'designs',
        productIds,
        createdByCompanyId: actorCompanyId,
      });
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
    const token = await this.insertToken({
      kind: 'product',
      targetId: product.id,
      createdByCompanyId: actorCompanyId,
    });
    return this.get(token);
  }

  /**
   * Authenticated redeem: navigate to the target only.
   * Never creates CollectionViewGrant — recipient must Request Access; pack owner Allows.
   */
  async claim(actorCompanyId: string, token: string): Promise<ShareLinkClaimView> {
    const view = await this.get(token);
    if (view.kind === 'collection') {
      const collection = await this.prisma.collection.findUnique({
        where: { id: view.targetId },
        select: {
          id: true,
          companyId: true,
          status: true,
        },
      });
      if (!collection || collection.status !== CollectionStatus.Published) {
        throw new NotFoundException({ code: 'NOT_FOUND', message: 'This link has expired.' });
      }
      void actorCompanyId;
      return {
        kind: 'collection',
        targetId: view.targetId,
        path: `/collections/${view.targetId}`,
      };
    }
    if (view.kind === 'designs') {
      const ids = view.designs.map((d) => d.id);
      const fallbackIds =
        ids.length > 0
          ? ids
          : (
              await this.prisma.catalogShareLink.findUnique({
                where: { token },
                select: { productIds: true },
              })
            )?.productIds ?? [];
      const params = new URLSearchParams();
      params.set('ids', fallbackIds.join(','));
      return {
        kind: 'designs',
        targetId: view.targetId,
        path: `/designs/set?${params.toString()}`,
      };
    }
    return {
      kind: 'product',
      targetId: view.targetId,
      path: `/explore/products/${view.targetId}`,
    };
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
          companyId: true,
          name: true,
          coverImage: true,
          audience: true,
          status: true,
          startsAt: true,
          endsAt: true,
          repostSourceCollectionId: true,
          company: { select: { name: true } },
        },
      });
      if (!collection) {
        throw new NotFoundException({ code: 'NOT_FOUND', message: 'This link has expired.' });
      }
      const availability = await resolveBuyerRepostPackAvailability(this.prisma, [
        {
          id: collection.id,
          companyId: collection.companyId,
          repostSourceCollectionId: collection.repostSourceCollectionId,
        },
      ]);
      const softUnavailable = availability.omitIds.has(collection.id);
      const open = !softUnavailable && shareLinkOpenForCollection(collection);
      const eligibleIds = availability.eligibleProductIdsByPackId.get(collection.id);
      let designs = open ? await this.collectionDesigns(collection.id) : [];
      if (open && eligibleIds) {
        designs = designs.filter((d) => eligibleIds.has(d.id));
      }
      return {
        token,
        kind: 'collection',
        targetId: collection.id,
        name: collection.name,
        companyName: collection.company.name,
        image: softUnavailable
          ? null
          : designs[0]?.image ?? collection.coverImage,
        audience: collection.audience,
        open,
        designs,
        expired: false,
        path: `/s/${token}`,
      };
    }
    if ((row.productIds?.length ?? 0) >= 2) {
      return this.designsShareView(token, row.productIds);
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
      // Soft-unavailable packs must not leak design thumbs via OG teasers.
      // Closed packs may still tease eligible thumbs; get() hides designs when !open.
      if (view.designs.length === 0 && !view.image && !view.open) {
        // Omitted soft pack (get cleared image + designs).
        return { paths: [], companyName: view.companyName };
      }
      let designs =
        view.designs.length > 0
          ? view.designs
          : await this.collectionDesigns(row.collectionId);
      if (view.designs.length === 0 && row.collectionId) {
        const collection = await this.prisma.collection.findUnique({
          where: { id: row.collectionId },
          select: {
            id: true,
            companyId: true,
            repostSourceCollectionId: true,
          },
        });
        if (collection) {
          const availability = await resolveBuyerRepostPackAvailability(this.prisma, [
            {
              id: collection.id,
              companyId: collection.companyId,
              repostSourceCollectionId: collection.repostSourceCollectionId,
            },
          ]);
          if (availability.omitIds.has(collection.id)) {
            return { paths: [], companyName: view.companyName };
          }
          const eligibleIds = availability.eligibleProductIdsByPackId.get(collection.id);
          if (eligibleIds) {
            designs = designs.filter((d) => eligibleIds.has(d.id));
          }
        }
      }
      const paths = designs
        .map((d) => d.image)
        .filter((p): p is string => Boolean(p))
        .slice(0, 4);
      if (paths.length === 0 && view.image) paths.push(view.image);
      return { paths, companyName: view.companyName };
    }
    if ((row.productIds?.length ?? 0) >= 2) {
      const designs = await this.productsAsDesignPreviews(row.productIds);
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

  private async designsShareView(
    token: string,
    productIds: string[],
  ): Promise<ShareLinkView> {
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
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
    const byId = new Map(products.map((row) => [row.id, row]));
    const ordered = productIds.map((id) => byId.get(id)).filter(Boolean) as typeof products;
    if (ordered.length < 1) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'This link has expired.' });
    }
    const open = ordered.every((product) => shareLinkOpenForProduct(product));
    const designs: ShareLinkDesignPreview[] = open
      ? ordered.map((product) => ({
          id: product.id,
          name: product.name,
          image: product.images[0] ?? null,
        }))
      : [];
    const thumbs = ordered
      .map((product) => product.images[0])
      .filter((url): url is string => Boolean(url));
    return {
      token,
      kind: 'designs',
      targetId: ordered[0]!.id,
      name: designAlbumCaption(productIds.length),
      companyName: ordered[0]!.company.name,
      image: thumbs[0] ?? null,
      audience: ordered[0]!.audience,
      open,
      designs,
      expired: false,
      path: `/s/${token}`,
    };
  }

  private async productsAsDesignPreviews(
    productIds: string[],
  ): Promise<ShareLinkDesignPreview[]> {
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, images: true },
    });
    const byId = new Map(products.map((row) => [row.id, row]));
    return productIds
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((product) => ({
        id: product!.id,
        name: product!.name,
        image: product!.images[0] ?? null,
      }));
  }

  private async collectionDesigns(collectionId: string): Promise<ShareLinkDesignPreview[]> {
    // Active members only — excluded tombstones never appear in teasers or open payloads.
    const rows = await this.prisma.collectionProduct.findMany({
      where: { collectionId, excluded: false },
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

  private async insertToken(options: {
    kind: 'collection' | 'product' | 'designs';
    targetId?: string;
    productIds?: string[];
    createdByCompanyId: string;
  }): Promise<string> {
    const token = randomToken(18);
    await this.prisma.catalogShareLink.create({
      data: {
        token,
        collectionId: options.kind === 'collection' ? options.targetId! : null,
        productId: options.kind === 'product' ? options.targetId! : null,
        productIds: options.kind === 'designs' ? (options.productIds ?? []) : [],
        createdByCompanyId: options.createdByCompanyId,
        expiresAt: new Date(Date.now() + TTL_MS),
      },
    });
    return token;
  }
}
