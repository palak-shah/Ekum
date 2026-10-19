import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../auth/decorators/public.decorator';
import type { Env } from '../core/config/config.schema';

@Controller({ path: 'version', version: '1' })
export class VersionController {
  constructor(private readonly config: ConfigService<Env, true>) {}

  @Public()
  @Get()
  identity() {
    return {
      service: 'ekum-api',
      version: this.config.get('EKUM_VERSION', { infer: true }),
      buildId: this.config.get('EKUM_BUILD_ID', { infer: true }),
      gitSha: this.config.get('EKUM_GIT_SHA', { infer: true }),
      builtAt: this.config.get('EKUM_BUILT_AT', { infer: true }),
      deployment: this.config.get('EKUM_DEPLOYMENT', { infer: true }),
    };
  }
}
