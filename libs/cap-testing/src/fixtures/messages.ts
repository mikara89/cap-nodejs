import type {
  CapHeaders,
  CapPublishEvent,
  CapReceivedEvent,
  JsonValue,
} from '@mikara89/cap-core';

export interface CreatePublishFixtureOptions<T extends JsonValue = JsonValue> {
  id?: string;
  topic?: string;
  occurredAt?: string;
  payload?: T;
  headers?: CapHeaders;
  retryCount?: number;
  status?: CapPublishEvent<T>['status'];
  nextRetryAt?: Date | null;
  lastError?: string | null;
  lockedBy?: string | null;
  lockedUntil?: Date | null;
  publishedAt?: Date | null;
}

export interface CreateReceivedFixtureOptions<
  T extends JsonValue = JsonValue,
> extends Omit<CreatePublishFixtureOptions<T>, 'status'> {
  group?: string;
  messageId?: string;
  dedupeKey?: string;
  retryCount?: number;
  status?: CapReceivedEvent<T>['status'];
  processed?: boolean;
  lastError?: string | null;
  processedAt?: Date | null;
  nextRetry?: Date | null;
}

export function createPublishFixture<T extends JsonValue = JsonValue>(
  options: CreatePublishFixtureOptions<T> = {},
): CapPublishEvent<T> {
  return {
    id: options.id ?? 'publish-1',
    topic: options.topic ?? 'test.topic',
    occurredAt: options.occurredAt ?? '2026-06-16T00:00:00.000Z',
    payload: options.payload ?? ({} as T),
    headers: options.headers,
    retryCount: options.retryCount ?? 0,
    status: options.status ?? 'pending',
    nextRetryAt: options.nextRetryAt ?? null,
    lastError: options.lastError ?? null,
    lockedBy: options.lockedBy ?? null,
    lockedUntil: options.lockedUntil ?? null,
    publishedAt: options.publishedAt ?? null,
  };
}

export function createReceivedFixture<T extends JsonValue = JsonValue>(
  options: CreateReceivedFixtureOptions<T> = {},
): CapReceivedEvent<T> {
  const topic = options.topic ?? 'test.topic';
  const group = options.group ?? 'test-group';
  const messageId = options.messageId ?? 'message-1';
  return {
    id: options.id ?? 'received-1',
    topic,
    group,
    messageId,
    dedupeKey: options.dedupeKey ?? `${topic}|${group}|${messageId}`,
    occurredAt: options.occurredAt ?? '2026-06-16T00:00:00.000Z',
    payload: options.payload ?? ({} as T),
    headers: options.headers,
    retryCount: options.retryCount ?? 0,
    status: options.status ?? 'pending',
    processed: options.processed ?? false,
    lastError: options.lastError ?? null,
    processedAt: options.processedAt ?? null,
    nextRetry: options.nextRetry ?? null,
  };
}
