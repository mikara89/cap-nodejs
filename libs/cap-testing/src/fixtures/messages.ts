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
}

export interface CreateReceivedFixtureOptions<
  T extends JsonValue = JsonValue,
> extends CreatePublishFixtureOptions<T> {
  group?: string;
  messageId?: string;
  dedupeKey?: string;
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
    retryCount: 0,
    status: 'pending',
    nextRetryAt: null,
    lastError: null,
    lockedBy: null,
    lockedUntil: null,
    publishedAt: null,
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
    retryCount: 0,
    status: 'pending',
    processed: false,
    lastError: null,
    processedAt: null,
    nextRetry: null,
  };
}
