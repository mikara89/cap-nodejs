import { Entity, PrimaryKey, Property, Index } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';

/**
 * MikroORM entity for CAP inbox (received events).
 * Stores incoming messages for processing and retry logic.
 */
@Entity({ tableName: 'cap_received' })
@Index({ properties: ['processed', 'nextRetry'] })
@Index({ properties: ['topic', 'group'] })
export class CapReceivedEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = uuid();

  @Property({ type: 'string', length: 255 })
  topic!: string;

  @Property({ type: 'string', length: 255 })
  group!: string;

  @Property({ type: 'json' })
  payload!: Record<string, unknown>;

  @Property({ type: 'json', nullable: true })
  headers?: Record<string, string>;

  @Property({ type: 'boolean', default: false })
  processed = false;

  @Property({ type: 'number', default: 0 })
  retryCount = 0;

  @Property({ type: 'datetime', nullable: true })
  nextRetry?: Date;

  @Property({ type: 'datetime' })
  createdAt: Date = new Date();

  @Property({ type: 'datetime', onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
