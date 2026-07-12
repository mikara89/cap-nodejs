import {
  CAP_MESSAGE_ENVELOPE_KIND,
  CAP_MESSAGE_ENVELOPE_VERSION,
  type CapMessageEnvelopeV1,
  type DecodeCapMessageOptions,
  type DecodedCapMessage,
} from '../models/cap-message-envelope';
import {
  type CapHeaderValue,
  type CapHeaders,
} from '../models/cap-headers.type';
import { type JsonValue } from '../models/json-value.type';

const hasOwn = (value: object, key: PropertyKey): boolean =>
  Object.hasOwn(value, key);

export class UnsupportedCapMessageEnvelopeVersionError extends Error {
  readonly version: unknown;

  constructor(version: unknown) {
    super(`Unsupported CAP message envelope version: ${String(version)}`);
    this.name = 'UnsupportedCapMessageEnvelopeVersionError';
    this.version = version;
  }
}

export class MalformedCapMessageEnvelopeError extends Error {
  constructor(reason: string) {
    super(`Malformed CAP message envelope: ${reason}`);
    this.name = 'MalformedCapMessageEnvelopeError';
  }
}

export class LegacyCapMessageEnvelopeRejectedError extends Error {
  constructor() {
    super(
      'Legacy unversioned CAP message envelopes are rejected. Use createCapMessageEnvelope() or configure messageEnvelope.legacyUnversioned.',
    );
    this.name = 'LegacyCapMessageEnvelopeRejectedError';
  }
}

export function createCapMessageEnvelope<TPayload extends JsonValue>(
  payload: TPayload,
  headers?: CapHeaders,
): CapMessageEnvelopeV1<TPayload> {
  const envelope: CapMessageEnvelopeV1<TPayload> = {
    $cap: {
      kind: CAP_MESSAGE_ENVELOPE_KIND,
      version: CAP_MESSAGE_ENVELOPE_VERSION,
    },
    payload,
  };

  return headers === undefined
    ? envelope
    : { ...envelope, headers: { ...headers } };
}

export function isCapMessageEnvelopeV1(
  value: unknown,
): value is CapMessageEnvelopeV1 {
  if (!isRecord(value) || !hasOwn(value, '$cap')) return false;
  const marker = value.$cap;
  if (!isRecord(marker)) return false;
  if (
    !hasOwn(marker, 'kind') ||
    marker.kind !== CAP_MESSAGE_ENVELOPE_KIND ||
    !hasOwn(marker, 'version') ||
    marker.version !== CAP_MESSAGE_ENVELOPE_VERSION ||
    !hasOwn(value, 'payload') ||
    !isJsonValue(value.payload)
  ) {
    return false;
  }

  return (
    !hasOwn(value, 'headers') ||
    value.headers === undefined ||
    isCapHeaders(value.headers)
  );
}

export function decodeCapMessage(
  value: unknown,
  options: DecodeCapMessageOptions = {},
): DecodedCapMessage {
  if (isExplicitCapEnvelopeKind(value)) {
    validateExplicitEnvelope(value);
    const envelope = value as CapMessageEnvelopeV1;
    return {
      payload: envelope.payload,
      headers: mergeHeaders(envelope.headers, options.explicitHeaders),
      envelopeVersion: CAP_MESSAGE_ENVELOPE_VERSION,
      legacyEnvelope: false,
    };
  }

  if (isStrictLegacyEnvelope(value)) {
    if ((options.legacyEnvelopeMode ?? 'warn') === 'reject') {
      throw new LegacyCapMessageEnvelopeRejectedError();
    }
    return {
      payload: value.payload,
      headers: mergeHeaders(value.headers, options.explicitHeaders),
      legacyEnvelope: true,
    };
  }

  return {
    payload: value as JsonValue,
    headers: cloneHeaders(options.explicitHeaders),
    legacyEnvelope: false,
  };
}

function validateExplicitEnvelope(
  value: Record<string, unknown>,
): asserts value is Record<string, unknown> & CapMessageEnvelopeV1 {
  const marker = value.$cap as Record<string, unknown>;
  if (!hasOwn(marker, 'version')) {
    throw new MalformedCapMessageEnvelopeError('missing $cap.version');
  }
  if (marker.version !== CAP_MESSAGE_ENVELOPE_VERSION) {
    throw new UnsupportedCapMessageEnvelopeVersionError(marker.version);
  }
  if (!hasOwn(value, 'payload')) {
    throw new MalformedCapMessageEnvelopeError('missing own payload');
  }
  if (!isJsonValue(value.payload)) {
    throw new MalformedCapMessageEnvelopeError(
      'payload is not JSON-serializable',
    );
  }
  if (
    hasOwn(value, 'headers') &&
    value.headers !== undefined &&
    !isCapHeaders(value.headers)
  ) {
    throw new MalformedCapMessageEnvelopeError('headers are invalid');
  }
}

function isExplicitCapEnvelopeKind(
  value: unknown,
): value is Record<string, unknown> {
  if (!isRecord(value) || !hasOwn(value, '$cap')) return false;
  const marker = value.$cap;
  return (
    isRecord(marker) &&
    hasOwn(marker, 'kind') &&
    marker.kind === CAP_MESSAGE_ENVELOPE_KIND
  );
}

function isStrictLegacyEnvelope(
  value: unknown,
): value is { payload: JsonValue; headers?: CapHeaders } {
  if (
    !isRecord(value) ||
    hasOwn(value, '$cap') ||
    !hasOwn(value, 'payload') ||
    !isJsonValue(value.payload)
  ) {
    return false;
  }
  const keys = Object.keys(value);
  if (
    keys.some((key) => key !== 'payload' && key !== 'headers') ||
    keys.length < 1
  ) {
    return false;
  }
  return (
    !hasOwn(value, 'headers') ||
    value.headers === undefined ||
    isCapHeaders(value.headers)
  );
}

function mergeHeaders(
  lowerPrecedence?: CapHeaders,
  higherPrecedence?: CapHeaders,
): CapHeaders | undefined {
  const merged = { ...(lowerPrecedence ?? {}), ...(higherPrecedence ?? {}) };
  return Object.keys(merged).length === 0 ? undefined : merged;
}

function cloneHeaders(headers?: CapHeaders): CapHeaders | undefined {
  return headers === undefined || Object.keys(headers).length === 0
    ? undefined
    : { ...headers };
}

function isCapHeaders(value: unknown): value is CapHeaders {
  return (
    isRecord(value) &&
    Object.values(value).every((entry) => isCapHeaderValue(entry))
  );
}

function isCapHeaderValue(value: unknown): value is CapHeaderValue {
  return (
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value)) ||
    (value instanceof Date && !Number.isNaN(value.getTime()))
  );
}

function isJsonValue(value: unknown): value is JsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  ) {
    return true;
  }
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every((entry) => isJsonValue(entry));
  if (!isPlainRecord(value)) return false;
  return Object.values(value).every((entry) => isJsonValue(entry));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
