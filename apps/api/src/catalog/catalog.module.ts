import { Module, forwardRef } from '@nestjs/common';
import { ProductController } from './product.controller';
import { CollectionController } from './collection.controller';
import { ShareLinkController } from './share-link.controller';
import {
  CollectionViewGrantController,
  CollectionViewRequestController,
} from './collection-view-request.controller';
import {
  ProductRelistGrantController,
  RelistRequestController,
} from './relist-request.controller';
import { ProductService } from './product.service';
import { CollectionService } from './collection.service';
import { ShareLinkService } from './share-link.service';
import { CatalogSerializer } from './catalog.serializer';
import { CollectionViewRequestService } from './collection-view-request.service';
import { RelistRequestService } from './relist-request.service';
import { ConversationModule } from '../conversation/conversation.module';
import { AccessModule } from '../access/access.module';
import { AbsolutizeProductImagesPipe } from '../media/absolutize-product-images.pipe';

/**
 * Catalog. Owns Products, Collections, and their many-to-many join. Publish is a
 * lifecycle state here; sharing to specific buyers is a separate event handled by
 * Broadcast. Cross-company/discovery reads are gated by the Access domain (M4).
 */
@Module({
  imports: [forwardRef(() => ConversationModule), AccessModule],
  controllers: [
    ProductController,
    CollectionController,
    ShareLinkController,
    CollectionViewRequestController,
    CollectionViewGrantController,
    RelistRequestController,
    ProductRelistGrantController,
  ],
  providers: [
    ProductService,
    CollectionService,
    ShareLinkService,
    CatalogSerializer,
    CollectionViewRequestService,
    RelistRequestService,
    AbsolutizeProductImagesPipe,
  ],
  exports: [CatalogSerializer, CollectionViewRequestService, RelistRequestService],
})
export class CatalogModule {}
