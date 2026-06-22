import { Entity, PrimaryKey, Property, Index, Unique } from '@mikro-orm/core';
import type {
  CapHeaders,
  CapReceivedStatus,
  JsonValue,
} from '@mikara89/cap-core';
import { v4 as uuid } from 'uuid';

/**
 * MikroORM entity for CAP inbox (received events).
 * Stores incoming messages for processing and retry logic.
 */
@Entity({ tableName: 'cap_received' })
@Index({ properties: ['status', 'nextRetry'] })
@Index({ properties: ['topic', 'group'] })
@Unique({ properties: ['group', 'dedupeKey'] })
export class CapReceivedEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = uuid();

  @Property({ type: 'string', length: 255 })
  topic!: string;

  @Property({ type: 'string', length: 255 })
  group!: string;

  @Property({ type: 'string', length: 255 })
  messageId!: string;

  @Property({ type: 'string', length: 512 })
  dedupeKey!: string;

  @Property({ type: 'json' })
  payload!: JsonValue;

  @Property({ type: 'json', nullable: true })
  headers?: CapHeaders;

  @Property({ type: 'boolean', default: false })
  processed = false;

  @Property({ type: 'number', default: 0 })
  retryCount = 0;

  @Property({ type: 'string', length: 32, default: 'pending' })
  status: CapReceivedStatus = 'pending';

  @Property({ type: 'string', nullable: true })
  lastError?: string | null;

  @Property({ type: 'datetime', nullable: true })
  nextRetry?: Date;

  @Property({ type: 'datetime', nullable: true })
  processedAt?: Date | null;

  @Property({ type: 'datetime' })
  createdAt: Date = new Date();

  @Property({ type: 'datetime', onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
