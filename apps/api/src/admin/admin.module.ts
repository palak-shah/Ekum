import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { AdminTagController, AdminMasterCategoriesController } from './admin-tag.controller';
import { AdminTagService } from './admin-tag.service';
import { PlatformAdminGuard } from './require-platform-admin';

@Module({
  imports: [CatalogModule],
  controllers: [AdminTagController, AdminMasterCategoriesController],
  providers: [AdminTagService, PlatformAdminGuard],
})
export class AdminModule {}
