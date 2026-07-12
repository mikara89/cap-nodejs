import { Injectable } from '@nestjs/common';
import type {
  CapHeaders,
  SubscribeMetadata,
  SubscriberPort,
} from '@mikara89/cap-core';

type MessageHandler = (
  payload: unknown,
  headers?: CapHeaders,
  metadata?: SubscribeMetadata,
) => Promise<void>;

interface LegacyNestjsWrapper {
  payload: unknown;
  headers?: CapHeaders;
  metadata: Record<string, unknown>;
}

let legacyNestjsWrapperWarningEmitted = false;

/**
 * Reset the legacy wrapper warning flag. Intended for test use only —
 * allows each test case to observe a fresh warning cycle.
 * @internal
 */
export function __resetLegacyNestjsWrapperWarningForTest(): void {
  legacyNestjsWrapperWarningEmitted = false;
}

const LEGACY_NESTJS_WRAPPER_KEYS = new Set(['payload', 'headers', 'metadata']);

function hasOwn(value: object, property: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(value, property);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

/**
 * Detects the historical NestJS microservices transport wrapper
 * `{ payload, headers?, metadata }`. The presence of `metadata`
 * alongside `payload` distinguishes this from core's own legacy
 * envelope shape `{ payload, headers? }` and from ordinary business
 * objects that happen to include a `payload` field.
 */
function isLegacyNestjsWrapper(value: unknown): value is LegacyNestjsWrapper {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  if (!hasOwn(obj, 'payload') || !hasOwn(obj, 'metadata')) {
    return false;
  }

  const keys = Object.keys(obj);

  if (keys.some((key) => !LEGACY_NESTJS_WRAPPER_KEYS.has(key))) {
    return false;
  }

  if (!isPlainRecord(obj.metadata)) {
    return false;
  }

  if (
    hasOwn(obj, 'headers') &&
    obj.headers !== undefined &&
    obj.headers !== null &&
    !isPlainRecord(obj.headers)
  ) {
    return false;
  }

  return true;
}

function unwrapLegacyNestjsWrapper(wrapper: LegacyNestjsWrapper): {
  message: unknown;
  headers?: CapHeaders;
  metadata?: SubscribeMetadata;
} {
  const nestedHeaders =
    wrapper.headers !== undefined && wrapper.headers !== null
      ? wrapper.headers
      : undefined;
  const nestedMetadata = wrapper.metadata as
    | Record<string, unknown>
    | undefined;

  return {
    message: wrapper.payload,
    headers: nestedHeaders,
    metadata: {
      messageId:
        typeof nestedMetadata?.messageId === 'string'
          ? nestedMetadata.messageId
          : undefined,
      dedupeKey:
        typeof nestedMetadata?.dedupeKey === 'string'
          ? nestedMetadata.dedupeKey
          : undefined,
    },
  };
}

function mergeTransportHeaders(
  nested?: CapHeaders,
  transport?: CapHeaders,
): CapHeaders | undefined {
  const merged = { ...(nested ?? {}), ...(transport ?? {}) };
  return Object.keys(merged).length > 0 ? merged : undefined;
}

function mergeTransportMetadata(
  nested?: SubscribeMetadata,
  transport?: SubscribeMetadata,
): SubscribeMetadata | undefined {
  const messageId = transport?.messageId ?? nested?.messageId;
  const dedupeKey = transport?.dedupeKey ?? nested?.dedupeKey;
  if (messageId === undefined && dedupeKey === undefined) return undefined;
  return {
    messageId,
    dedupeKey,
  };
}

@Injectable()
export class CapMicroservicesBridge implements SubscriberPort {
  private readonly handlers = new Map<string, Set<MessageHandler>>();

  async consume(
    topic: string,
    group: string,
    onMessage: MessageHandler,
  ): Promise<void> {
    const key = this.getKey(topic, group);
    if (!this.handlers.has(key)) {
      this.handlers.set(key, new Set());
    }

    this.handlers.get(key)?.add(onMessage);
    await Promise.resolve();
  }

  async dispatch(
    topic: string,
    group: string,
    message: unknown,
    headers?: CapHeaders,
    metadata?: SubscribeMetadata,
  ): Promise<void> {
    const handlers = this.handlers.get(this.getKey(topic, group));
    if (!handlers?.size) return;

    let effectiveMessage = message;
    let effectiveHeaders = headers;
    let effectiveMetadata = metadata;

    if (isLegacyNestjsWrapper(message)) {
      if (!legacyNestjsWrapperWarningEmitted) {
        legacyNestjsWrapperWarningEmitted = true;

        console.warn(
          'CAP NestJS Microservices: Detected legacy { payload, headers, metadata } transport wrapper. ' +
            'Upgrade publishers to use createCapMessageEnvelope() for versioned envelopes. ' +
            'This compatibility path will be removed in a future major release.',
        );
      }
      const unwrapped = unwrapLegacyNestjsWrapper(message);
      effectiveMessage = unwrapped.message;
      effectiveHeaders = mergeTransportHeaders(unwrapped.headers, headers);
      effectiveMetadata = mergeTransportMetadata(unwrapped.metadata, metadata);
    }

    await Promise.all(
      [...handlers].map((handler) =>
        handler(effectiveMessage, effectiveHeaders, effectiveMetadata),
      ),
    );
  }

  private getKey(topic: string, group: string): string {
    return `${topic}|${group}`;
  }
}
