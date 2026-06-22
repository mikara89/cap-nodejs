import { type InboxItemDto } from './inbox-item.dto';
import { type OutboxItemDto } from './outbox-item.dto';

export class OutboxPageDto {
  items!: OutboxItemDto[];
  total!: number;
  page!: number;
  limit!: number;
}

export class InboxPageDto {
  items!: InboxItemDto[];
  total!: number;
  page!: number;
  limit!: number;
}
