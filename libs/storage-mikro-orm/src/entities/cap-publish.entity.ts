import { Entity, PrimaryKey, Property, Index } from '@mikro-orm/core';
import type { CapHeaders, CapPublishStatus, JsonValue } from '@mikara89/cap-nest';
import { v4 as uuid } from 'uuid';

/**
 * MikroORM entity for CAP outbox (publish events).
 * Stores messages pending publication or failed publish attempts.
 */
@Entity({ tableName: 'cap_publish' })
@Index({ properties: ['status', 'createdAt'] })
export class CapPublishEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = uuid();

  @Property({ type: 'string', length: 255 })
  topic!: string;

  @Property({ type: 'json' })
  payload!: JsonValue;

  @Property({ type: 'json', nullable: true })
  headers?: CapHeaders;

  @Property({ type: 'string', length: 50, default: 'pending' })
  status: CapPublishStatus = 'pending';

  @Property({ type: 'number', default: 0 })
  retryCount = 0;

  @Property({ type: 'datetime', nullable: true })
  nextRetryAt?: Date | null;

  @Property({ type: 'text', nullable: true })
  lastError?: string | null;

  @Property({ type: 'string', nullable: true, length: 255 })
  lockedBy?: string | null;

  @Property({ type: 'datetime', nullable: true })
  lockedUntil?: Date | null;

  @Property({ type: 'datetime', nullable: true })
  publishedAt?: Date | null;

  @Property({ type: 'datetime' })
  createdAt: Date = new Date();

  @Property({ type: 'datetime', onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
