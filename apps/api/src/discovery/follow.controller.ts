import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import { FollowService } from './follow.service';

const followSchema = z.object({ companyId: z.string().min(1) });
type FollowDto = z.infer<typeof followSchema>;

const decideSchema = z.object({
  followerCompanyId: z.string().min(1),
  decision: z.enum(['look', 'pack', 'deny']),
});
type DecideDto = z.infer<typeof decideSchema>;

const accessSchema = z.object({
  accessKind: z.enum(['look', 'pack']),
});
type AccessDto = z.infer<typeof accessSchema>;

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

  @Post('decide')
  decide(
    @CurrentCompanyId() companyId: string,
    @Body(new ZodValidationPipe(decideSchema)) dto: DecideDto,
  ) {
    return this.follows.decide(companyId, dto.followerCompanyId, dto.decision);
  }

  @Patch(':followerCompanyId/access')
  setAccess(
    @CurrentCompanyId() companyId: string,
    @Param('followerCompanyId') followerCompanyId: string,
    @Body(new ZodValidationPipe(accessSchema)) dto: AccessDto,
  ) {
    return this.follows.setAccess(companyId, followerCompanyId, dto.accessKind);
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

  @Get('pending')
  pending(@CurrentCompanyId() companyId: string) {
    return this.follows.listOutgoingPending(companyId);
  }

  @Get('asks')
  asks(@CurrentCompanyId() companyId: string) {
    return this.follows.listAsks(companyId);
  }

  @Get('followers')
  followers(@CurrentCompanyId() companyId: string) {
    return this.follows.listFollowers(companyId);
  }
}
