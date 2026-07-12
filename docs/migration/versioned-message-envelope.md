# Versioned CAP Message Envelope Migration

Earlier CAP core releases treated any inbound object containing `payload` as a
wrapper. That could silently discard sibling business fields such as `source`
and `type`. Core now recognizes only the explicit versioned CAP marker, plus a
strict temporary legacy shape.

## New Body Wrappers

Use `createCapMessageEnvelope()` when a custom transport or bridge cannot carry
headers separately:

```ts
createCapMessageEnvelope({ orderId: 'o1' }, { traceId: 'trace-1' });
```

Do not wrap bodies for RabbitMQ, Kafka, AWS SNS/SQS, Azure Service Bus, or other
transports that already map CAP headers to native metadata.

## Legacy Mode

Only objects whose enumerable keys are exactly `payload` and optional valid
`headers` are legacy envelopes. Configure:

- `accept` to unwrap without warning;
- `warn` (the default) to unwrap and warn once per engine;
- `reject` to require versioned envelopes.

```ts
new CapEngine({
  // ...ports
  messageEnvelope: { legacyUnversioned: 'reject' },
});
```

`CapModule.forRoot`, `CapModule.forRootAsync`, `CapModule.forInMemory`, and
`createCapExpress` pass the same option through to core.

Objects such as `{ payload, source, type }` are now preserved intact. Exact CAP
markers with malformed structure or unsupported versions reject before inbox
persistence; upgrade core before sending a newer envelope version.

The NestJS microservices transport previously emitted an adapter-specific
`{ payload, headers, metadata }` body. It now emits the version-1 CAP envelope
and carries message identity in `cap-message-id`; upgrade both sides of that
bridge together.
