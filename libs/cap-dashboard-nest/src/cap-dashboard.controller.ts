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
import { CapDashboardAccess } from './cap-dashboard.auth';

@Controller()
@UseGuards(CapDashboardGuard)
export class CapDashboardController {
  constructor(private readonly svc: CapDashboardService) {}

  @CapDashboardAccess('outbox.list', 'read')
  @Get('outbox')
  listOutbox(@Query() q: ListQueryDto): Promise<OutboxPageDto> {
    return this.svc.listOutbox(q);
  }

  @CapDashboardAccess('outbox.get', 'read')
  @Get('outbox/:id')
  getOutbox(
    @Param('id') id: string,
    @Query('full') full?: boolean,
  ): Promise<OutboxItemDto | undefined> {
    return this.svc.getOutboxById(id, !!full);
  }

  @CapDashboardAccess('outbox.retry', 'admin')
  @Post('outbox/:id/retry')
  retryOutbox(
    @Param('id') id: string,
    @Body() opts?: RetryOptions,
  ): Promise<ActionResultDto> {
    return this.svc.retryOutbox(id, opts);
  }

  @CapDashboardAccess('outbox.markPublished', 'admin')
  @Post('outbox/:id/mark-published')
  markOutboxPublished(@Param('id') id: string): Promise<ActionResultDto> {
    return this.svc.markOutboxPublished(id);
  }

  @CapDashboardAccess('inbox.list', 'read')
  @Get('inbox')
  listInbox(@Query() q: ListQueryDto): Promise<InboxPageDto> {
    return this.svc.listInbox(q);
  }

  @CapDashboardAccess('inbox.get', 'read')
  @Get('inbox/:id')
  getInbox(
    @Param('id') id: string,
    @Query('full') full?: boolean,
  ): Promise<InboxItemDto | undefined> {
    return this.svc.getInboxById(id, !!full);
  }

  @CapDashboardAccess('inbox.retry', 'admin')
  @Post('inbox/:id/retry')
  retryInbox(
    @Param('id') id: string,
    @Body() opts?: RetryOptions,
  ): Promise<ActionResultDto> {
    return this.svc.retryInbox(id, opts);
  }

  @CapDashboardAccess('inbox.markProcessed', 'admin')
  @Post('inbox/:id/mark-processed')
  markInboxProcessed(@Param('id') id: string): Promise<ActionResultDto> {
    return this.svc.markInboxProcessed(id);
  }

  @CapDashboardAccess('scheduler.flushOutbox', 'admin')
  @Post('scheduler/flush-outbox')
  flushOutbox(): Promise<ActionResultDto> {
    return this.svc.flushOutbox();
  }
}
