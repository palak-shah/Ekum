import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { z } from 'zod';
import { masterOptionKindValues } from '@ekum/domain-types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RequirePlatformAdmin } from './require-platform-admin';
import { AdminTagService } from './admin-tag.service';
import { MasterDataService } from '../catalog/master-data/master-data.service';

const createSchema = z.object({
  categoryId: z.string().min(1),
  kind: z.enum(masterOptionKindValues),
  label: z.string().trim().min(1).max(80),
});

const updateSchema = z.object({
  label: z.string().trim().min(1).max(80).optional(),
  active: z.boolean().optional(),
});

const bulkSchema = z.object({
  categoryId: z.string().min(1),
  kind: z.enum(masterOptionKindValues),
  text: z.string().min(1).max(50_000),
});

const bulkCommitSchema = z.object({
  categoryId: z.string().min(1),
  kind: z.enum(masterOptionKindValues),
  labels: z.array(z.string().trim().min(1).max(80)).min(1).max(500),
});

@Controller({ path: 'admin/tags', version: '1' })
@RequirePlatformAdmin()
export class AdminTagController {
  constructor(private readonly tags: AdminTagService) {}

  @Get()
  list(
    @Query('q') q?: string,
    @Query('categoryId') categoryId?: string,
    @Query('kind') kind?: (typeof masterOptionKindValues)[number],
    @Query('includeInactive') includeInactive?: string,
    @Query('take') takeRaw?: string,
    @Query('skip') skipRaw?: string,
  ) {
    const take = takeRaw ? Number.parseInt(takeRaw, 10) : undefined;
    const skip = skipRaw ? Number.parseInt(skipRaw, 10) : undefined;
    return this.tags.list({
      q,
      categoryId,
      kind,
      includeInactive: includeInactive === 'true' || includeInactive === '1',
      take: Number.isFinite(take) ? take : undefined,
      skip: Number.isFinite(skip) ? skip : undefined,
    });
  }

  @Post('bulk/preview')
  bulkPreview(@Body(new ZodValidationPipe(bulkSchema)) dto: z.infer<typeof bulkSchema>) {
    return this.tags.bulkPreview(dto);
  }

  @Post('bulk/commit')
  bulkCommit(
    @Body(new ZodValidationPipe(bulkCommitSchema)) dto: z.infer<typeof bulkCommitSchema>,
  ) {
    return this.tags.bulkCommit(dto);
  }

  @Post()
  create(@Body(new ZodValidationPipe(createSchema)) dto: z.infer<typeof createSchema>) {
    return this.tags.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateSchema)) dto: z.infer<typeof updateSchema>,
  ) {
    return this.tags.update(id, dto);
  }

  @Post(':id/archive')
  archive(@Param('id') id: string) {
    return this.tags.archive(id);
  }

  @Post(':id/restore')
  restore(@Param('id') id: string) {
    return this.tags.restore(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tags.remove(id);
  }
}

@Controller({ path: 'admin/master-categories', version: '1' })
@RequirePlatformAdmin()
export class AdminMasterCategoriesController {
  constructor(private readonly master: MasterDataService) {}

  @Get()
  list() {
    return this.master.listCategories(false);
  }
}
