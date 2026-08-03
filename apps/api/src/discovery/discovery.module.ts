import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { CatalogModule } from '../catalog/catalog.module';
import { FollowController } from './follow.controller';
import { ExploreController } from './explore.controller';
import { SearchController } from './search.controller';
import { FollowService } from './follow.service';
import { ExploreService } from './explore.service';
import { SearchService } from './search.service';
import { DiscoverySerializer } from './discovery.serializer';

/**
 * Discovery. Permissionless Follow, structured Explore feeds, and federated
 * search — all cursor-paginated and visibility-filtered. Depends on Access
 * (VisibilityService + contact-safe summaries) and Catalog (product serialization).
 */
@Module({
  imports: [AccessModule, CatalogModule],
  controllers: [FollowController, ExploreController, SearchController],
  providers: [FollowService, ExploreService, SearchService, DiscoverySerializer],
})
export class DiscoveryModule {}
