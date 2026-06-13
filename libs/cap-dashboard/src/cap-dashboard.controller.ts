import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CapDashboardService, RetryOptions } from './cap-dashboard.service';
import { CapDashboardGuard } from './guards/cap-dashboard.guard';
import { ListQueryDto } from './dto/list-query.dto';
import { OutboxPageDto } from './dto/page.dto';
import { OutboxItemDto } from './dto/outbox-item.dto';
import { InboxPageDto } from './dto/page.dto';
import { InboxItemDto } from './dto/inbox-item.dto';
import { ActionResultDto } from './dto/action-result.dto';

@Controller()
@UseGuards(CapDashboardGuard)
export class CapDashboardController {
  constructor(private readonly svc: CapDashboardService) {}

  @Get('outbox')
  listOutbox(@Query() q: ListQueryDto): Promise<OutboxPageDto> {
    return this.svc.listOutbox(q);
  }

  @Get('outbox/:id')
  getOutbox(
    @Param('id') id: string,
    @Query('full') full?: boolean,
  ): Promise<OutboxItemDto | undefined> {
    return this.svc.getOutboxById(id, !!full);
  }

  @Post('outbox/:id/retry')
  retryOutbox(
    @Param('id') id: string,
    @Body() opts?: RetryOptions,
  ): Promise<ActionResultDto> {
    return this.svc.retryOutbox(id, opts);
  }

  @Post('outbox/:id/mark-published')
  markOutboxPublished(@Param('id') id: string): Promise<ActionResultDto> {
    return this.svc.markOutboxPublished(id);
  }

  @Get('inbox')
  listInbox(@Query() q: ListQueryDto): Promise<InboxPageDto> {
    return this.svc.listInbox(q);
  }

  @Get('inbox/:id')
  getInbox(
    @Param('id') id: string,
    @Query('full') full?: boolean,
  ): Promise<InboxItemDto | undefined> {
    return this.svc.getInboxById(id, !!full);
  }

  @Post('inbox/:id/retry')
  retryInbox(
    @Param('id') id: string,
    @Body() opts?: RetryOptions,
  ): Promise<ActionResultDto> {
    return this.svc.retryInbox(id, opts);
  }

  @Post('inbox/:id/mark-processed')
  markInboxProcessed(@Param('id') id: string): Promise<ActionResultDto> {
    return this.svc.markInboxProcessed(id);
  }

  @Post('scheduler/flush-outbox')
  flushOutbox(): Promise<ActionResultDto> {
    return this.svc.flushOutbox();
  }
}
