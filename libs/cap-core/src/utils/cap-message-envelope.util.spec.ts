import {
  CAP_MESSAGE_ENVELOPE_KIND,
  CAP_MESSAGE_ENVELOPE_VERSION,
} from '../models/cap-message-envelope';
import {
  LegacyCapMessageEnvelopeRejectedError,
  MalformedCapMessageEnvelopeError,
  UnsupportedCapMessageEnvelopeVersionError,
  createCapMessageEnvelope,
  decodeCapMessage,
  isCapMessageEnvelopeV1,
} from './cap-message-envelope.util';

describe('CAP message envelope', () => {
  describe('createCapMessageEnvelope', () => {
    it('creates the exact version-1 marker and preserves payload and headers', () => {
      const payload = { orderId: 'o1' };
      const headers = { traceId: 'trace-1', attempt: 2, enabled: true };

      expect(createCapMessageEnvelope(payload, headers)).toEqual({
        $cap: {
          kind: CAP_MESSAGE_ENVELOPE_KIND,
          version: CAP_MESSAGE_ENVELOPE_VERSION,
        },
        payload,
        headers,
      });
    });

    it('omits missing headers and does not mutate source objects', () => {
      const payload = { nested: { value: 1 } };
      const headers = { traceId: 'trace-1' };
      const payloadBefore = structuredClone(payload);
      const headersBefore = { ...headers };

      const withoutHeaders = createCapMessageEnvelope(payload);
      const withHeaders = createCapMessageEnvelope(payload, headers);
      withHeaders.headers!.traceId = 'changed';

      expect(withoutHeaders).not.toHaveProperty('headers');
      expect(payload).toEqual(payloadBefore);
      expect(headers).toEqual(headersBefore);
    });
  });

  describe('isCapMessageEnvelopeV1', () => {
    const valid = createCapMessageEnvelope(
      { value: 1 },
      { traceId: 'trace-1' },
    );

    it('recognizes a valid envelope', () => {
      expect(isCapMessageEnvelopeV1(valid)).toBe(true);
    });

    it.each([
      ['array', []],
      ['null', null],
      ['missing marker', { payload: { value: 1 } }],
      [
        'unrelated kind',
        {
          $cap: { kind: 'customer.preference', version: 1 },
          payload: { value: 1 },
        },
      ],
      ['non-object marker', { $cap: 'cap.message', payload: { value: 1 } }],
      [
        'missing version',
        { $cap: { kind: CAP_MESSAGE_ENVELOPE_KIND }, payload: { value: 1 } },
      ],
      [
        'unsupported version',
        {
          $cap: { kind: CAP_MESSAGE_ENVELOPE_KIND, version: 2 },
          payload: { value: 1 },
        },
      ],
      [
        'missing payload',
        { $cap: { kind: CAP_MESSAGE_ENVELOPE_KIND, version: 1 } },
      ],
      [
        'invalid headers',
        {
          $cap: { kind: CAP_MESSAGE_ENVELOPE_KIND, version: 1 },
          payload: { value: 1 },
          headers: { nested: { invalid: true } },
        },
      ],
    ])('rejects %s', (_name, value) => {
      expect(isCapMessageEnvelopeV1(value)).toBe(false);
    });

    it('rejects inherited payload', () => {
      const value = Object.create({ payload: { inherited: true } }) as Record<
        string,
        unknown
      >;
      value.$cap = { kind: CAP_MESSAGE_ENVELOPE_KIND, version: 1 };

      expect(isCapMessageEnvelopeV1(value)).toBe(false);
    });

    it('rejects an inherited marker', () => {
      const value = Object.create({
        $cap: { kind: CAP_MESSAGE_ENVELOPE_KIND, version: 1 },
      }) as Record<string, unknown>;
      value.payload = { value: 1 };

      expect(isCapMessageEnvelopeV1(value)).toBe(false);
    });
  });

  describe('decodeCapMessage', () => {
    it('decodes version 1 and merges native headers with higher precedence', () => {
      const envelopeHeaders = {
        traceId: 'envelope-trace',
        source: 'envelope',
      };
      const explicitHeaders = {
        traceId: 'broker-trace',
        broker: 'rabbitmq',
      };
      const decoded = decodeCapMessage(
        createCapMessageEnvelope({ orderId: 'o1' }, envelopeHeaders),
        { explicitHeaders },
      );

      expect(decoded).toEqual({
        payload: { orderId: 'o1' },
        headers: {
          traceId: 'broker-trace',
          source: 'envelope',
          broker: 'rabbitmq',
        },
        envelopeVersion: 1,
        legacyEnvelope: false,
      });
      expect(envelopeHeaders).toEqual({
        traceId: 'envelope-trace',
        source: 'envelope',
      });
      expect(explicitHeaders).toEqual({
        traceId: 'broker-trace',
        broker: 'rabbitmq',
      });
    });

    it.each([
      [
        'object containing payload',
        {
          payload: { value: 123 },
          source: 'external-system',
          type: 'measurement',
        },
      ],
      [
        'business headers field',
        {
          payload: 'business value',
          headers: { display: 'business field' },
          additional: true,
        },
      ],
      [
        'unrelated marker',
        {
          $cap: { kind: 'customer.preference', version: 1 },
          payload: { enabled: true },
        },
      ],
      ['array', [1, 2]],
      ['string', 'value'],
      ['number', 42],
      ['boolean', true],
      ['null', null],
    ])('preserves ordinary %s payloads', (_name, value) => {
      expect(decodeCapMessage(value, { legacyEnvelopeMode: 'reject' })).toEqual(
        { payload: value, legacyEnvelope: false },
      );
    });

    it('preserves an inherited payload when there is no own payload', () => {
      const value = Object.create({ payload: { inherited: true } }) as Record<
        string,
        unknown
      >;
      value.source = 'business';

      expect(decodeCapMessage(value).payload).toBe(value);
    });

    it('rejects an unsupported explicit version without exposing payload', () => {
      const value = {
        $cap: { kind: CAP_MESSAGE_ENVELOPE_KIND, version: 2 },
        payload: { secret: 'do-not-log' },
      };

      expect(() => decodeCapMessage(value)).toThrow(
        UnsupportedCapMessageEnvelopeVersionError,
      );
      try {
        decodeCapMessage(value);
      } catch (error) {
        expect(error).toMatchObject({ version: 2 });
        expect((error as Error).message).not.toContain('do-not-log');
      }
    });

    it.each([
      [
        'missing version',
        { $cap: { kind: CAP_MESSAGE_ENVELOPE_KIND }, payload: { value: 1 } },
      ],
      [
        'missing payload',
        { $cap: { kind: CAP_MESSAGE_ENVELOPE_KIND, version: 1 } },
      ],
      [
        'invalid headers',
        {
          $cap: { kind: CAP_MESSAGE_ENVELOPE_KIND, version: 1 },
          payload: { value: 1 },
          headers: { invalid: null },
        },
      ],
    ])('rejects an explicit malformed envelope with %s', (_name, value) => {
      expect(() => decodeCapMessage(value)).toThrow(
        MalformedCapMessageEnvelopeError,
      );
    });
  });

  describe('legacy compatibility', () => {
    it.each([
      [{ payload: { value: 1 } }, { value: 1 }, undefined],
      [
        { payload: { value: 1 }, headers: { traceId: 'legacy' } },
        { value: 1 },
        { traceId: 'legacy' },
      ],
    ])('accepts a strict legacy envelope', (value, payload, headers) => {
      expect(decodeCapMessage(value, { legacyEnvelopeMode: 'accept' })).toEqual(
        { payload, headers, legacyEnvelope: true },
      );
    });

    it('merges explicit headers over accepted legacy headers', () => {
      expect(
        decodeCapMessage(
          {
            payload: { value: 1 },
            headers: { traceId: 'legacy', source: 'legacy' },
          },
          {
            legacyEnvelopeMode: 'accept',
            explicitHeaders: { traceId: 'native', broker: 'kafka' },
          },
        ),
      ).toEqual({
        payload: { value: 1 },
        headers: { traceId: 'native', source: 'legacy', broker: 'kafka' },
        legacyEnvelope: true,
      });
    });

    it('rejects a strict legacy envelope in reject mode', () => {
      expect(() =>
        decodeCapMessage(
          { payload: { value: 1 } },
          { legacyEnvelopeMode: 'reject' },
        ),
      ).toThrow(LegacyCapMessageEnvelopeRejectedError);
    });

    it.each([
      { payload: { value: 1 }, source: 'external' },
      { payload: { value: 1 }, headers: {}, extra: true },
      { payload: { value: 1 }, headers: { invalid: null } },
    ])('does not recognize a non-strict legacy shape', (value) => {
      expect(decodeCapMessage(value, { legacyEnvelopeMode: 'reject' })).toEqual(
        { payload: value, legacyEnvelope: false },
      );
    });
  });

  describe('JSON value validation', () => {
    it.each([
      ['Date', new Date()],
      ['Map', new Map()],
      ['Set', new Set()],
      ['RegExp', /abc/],
      ['Uint8Array', new Uint8Array([1, 2, 3])],
      [
        'class instance',
        new (class {
          value = 1;
        })(),
      ],
      [
        'object with non-JSON nested value',
        { nested: new Map([['key', 'value']]) },
      ],
      ['object with undefined value', { valid: 'string', invalid: undefined }],
    ])('rejects envelope payload containing %s', (_name, nonJsonPayload) => {
      const envelope = {
        $cap: { kind: CAP_MESSAGE_ENVELOPE_KIND, version: 1 },
        payload: nonJsonPayload,
      };

      expect(isCapMessageEnvelopeV1(envelope)).toBe(false);
      expect(() => decodeCapMessage(envelope)).toThrow(
        MalformedCapMessageEnvelopeError,
      );
    });

    it('rejects legacy envelope payload containing a Date', () => {
      const date = new Date();
      expect(
        decodeCapMessage({ payload: date }, { legacyEnvelopeMode: 'accept' }),
      ).toEqual({
        payload: { payload: date },
        legacyEnvelope: false,
      });
    });
  });
});
