import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import {
  createCollectionViewRequestSchema,
  type CreateCollectionViewRequestDto,
} from '@ekum/domain-types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Body } from '@nestjs/common';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import { CollectionViewRequestService } from './collection-view-request.service';

@Controller({ path: 'collection-view-requests', version: '1' })
export class CollectionViewRequestController {
  constructor(private readonly requests: CollectionViewRequestService) {}

  @Post()
  create(
    @CurrentCompanyId() companyId: string,
    @Body(new ZodValidationPipe(createCollectionViewRequestSchema))
    dto: CreateCollectionViewRequestDto,
  ) {
    return this.requests.create(companyId, dto.collectionId);
  }

  @Get('outgoing')
  outgoing(@CurrentCompanyId() companyId: string) {
    return this.requests.listOutgoingPending(companyId);
  }

  @Get('grants/mine')
  myGrants(@CurrentCompanyId() companyId: string) {
    return this.requests.listMyGrants(companyId);
  }

  @Post(':id/allow')
  allow(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.requests.allow(companyId, id);
  }

  @Post(':id/deny')
  deny(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.requests.deny(companyId, id);
  }
}

@Controller({ path: 'collections', version: '1' })
export class CollectionViewGrantController {
  constructor(private readonly requests: CollectionViewRequestService) {}

  @Get(':id/view-grants')
  listGrants(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.requests.listGrantsForCollection(companyId, id);
  }

  @Delete(':id/view-grants/:companyId')
  revoke(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @Param('companyId') granteeId: string,
  ) {
    return this.requests.revokeGrant(companyId, id, granteeId);
  }
}
