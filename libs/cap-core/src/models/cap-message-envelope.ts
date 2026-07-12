import { type CapHeaders } from './cap-headers.type';
import { type JsonValue } from './json-value.type';

export const CAP_MESSAGE_ENVELOPE_KIND = 'cap.message' as const;
export const CAP_MESSAGE_ENVELOPE_VERSION = 1 as const;

export interface CapMessageEnvelopeV1<TPayload extends JsonValue = JsonValue> {
  readonly $cap: {
    readonly kind: typeof CAP_MESSAGE_ENVELOPE_KIND;
    readonly version: typeof CAP_MESSAGE_ENVELOPE_VERSION;
  };
  readonly payload: TPayload;
  readonly headers?: CapHeaders;
}

export type CapMessageEnvelope<TPayload extends JsonValue = JsonValue> =
  CapMessageEnvelopeV1<TPayload>;

export type LegacyCapEnvelopeMode = 'accept' | 'warn' | 'reject';

export interface CapMessageEnvelopeOptions {
  legacyUnversioned?: LegacyCapEnvelopeMode;
}

export interface DecodeCapMessageOptions {
  explicitHeaders?: CapHeaders;
  legacyEnvelopeMode?: LegacyCapEnvelopeMode;
}

export interface DecodedCapMessage<TPayload extends JsonValue = JsonValue> {
  payload: TPayload;
  headers?: CapHeaders;
  envelopeVersion?: number;
  legacyEnvelope: boolean;
}
