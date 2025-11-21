import { Entity, PrimaryKey, Property, Index } from '@mikro-orm/core';
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
  payload!: Record<string, unknown>;

  @Property({ type: 'json', nullable: true })
  headers?: Record<string, string>;

  @Property({ type: 'string', nullable: true, length: 50 })
  status?: 'published' | 'failed';

  @Property({ type: 'number', default: 0 })
  retryCount = 0;

  @Property({ type: 'datetime' })
  createdAt: Date = new Date();

  @Property({ type: 'datetime', onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
