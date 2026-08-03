import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { createUploadUrlSchema, type CreateUploadUrlDto } from '@ekum/domain-types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthPrincipal } from '../auth/auth.types';
import { MediaService } from './media.service';

@Controller({ path: 'media', version: '1' })
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('upload-url')
  createUploadUrl(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Body(new ZodValidationPipe(createUploadUrlSchema)) dto: CreateUploadUrlDto,
  ) {
    return this.media.createUploadUrl(companyId, user.userId, dto);
  }

  @Post(':id/complete')
  @HttpCode(200)
  complete(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.media.complete(companyId, id);
  }

  @Get(':id')
  get(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.media.get(companyId, id);
  }
}
