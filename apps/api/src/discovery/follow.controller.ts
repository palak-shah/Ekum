import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import { FollowService } from './follow.service';

const followSchema = z.object({ companyId: z.string().min(1) });
type FollowDto = z.infer<typeof followSchema>;

@Controller({ path: 'follows', version: '1' })
export class FollowController {
  constructor(private readonly follows: FollowService) {}

  @Post()
  follow(
    @CurrentCompanyId() companyId: string,
    @Body(new ZodValidationPipe(followSchema)) dto: FollowDto,
  ) {
    return this.follows.follow(companyId, dto.companyId);
  }

  @Delete(':companyId')
  @HttpCode(200)
  unfollow(@CurrentCompanyId() companyId: string, @Param('companyId') target: string) {
    return this.follows.unfollow(companyId, target);
  }

  @Get('following')
  following(@CurrentCompanyId() companyId: string) {
    return this.follows.listFollowing(companyId);
  }

  @Get('followers')
  followers(@CurrentCompanyId() companyId: string) {
    return this.follows.listFollowers(companyId);
  }
}
