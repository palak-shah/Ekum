import { Body, Controller, Get, Header, Param, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createShareLinkSchema, type CreateShareLinkDto } from '@ekum/domain-types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import type { Env } from '../core/config/config.schema';
import { absoluteMediaUrl, shareLinkOgHtml } from './share-link-og';
import { ShareLinkService } from './share-link.service';

@Controller({ path: 'share-links', version: '1' })
export class ShareLinkController {
  constructor(
    private readonly links: ShareLinkService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Post()
  create(
    @CurrentCompanyId() companyId: string,
    @Body(new ZodValidationPipe(createShareLinkSchema)) dto: CreateShareLinkDto,
  ) {
    return this.links.create(companyId, dto);
  }

  @Public()
  @Get(':token/card')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async card(@Param('token') token: string) {
    const view = await this.links.get(token);
    const webOrigin = this.config
      .get('CORS_ORIGINS', { infer: true })
      .split(',')
      .map((origin) => origin.trim())[0];
    const mediaBase = this.config.get('PUBLIC_MEDIA_BASE_URL', { infer: true });
    return shareLinkOgHtml({
      view,
      pageUrl: `${webOrigin}/s/${view.token}`,
      imageUrl: absoluteMediaUrl(view.image, mediaBase),
      fallbackImageUrl: `${webOrigin}/brand/app-icon-512.png`,
    });
  }

  @Public()
  @Get(':token')
  get(@Param('token') token: string) {
    return this.links.get(token);
  }
}
