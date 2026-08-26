import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { CollectionController } from './collection.controller';
import { ShareLinkController } from './share-link.controller';
import { ProductService } from './product.service';
import { CollectionService } from './collection.service';
import { ShareLinkService } from './share-link.service';
import { CatalogSerializer } from './catalog.serializer';

/**
 * Catalog. Owns Products, Collections, and their many-to-many join. Publish is a
 * lifecycle state here; sharing to specific buyers is a separate event handled by
 * Broadcast. Cross-company/discovery reads are gated by the Access domain (M4).
 */
@Module({
  controllers: [ProductController, CollectionController, ShareLinkController],
  providers: [ProductService, CollectionService, ShareLinkService, CatalogSerializer],
  exports: [CatalogSerializer],
})
export class CatalogModule {}
