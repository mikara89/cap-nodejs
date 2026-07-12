# @mikara89/cap-transport-nestjs-microservices

NestJS `ClientProxy` transport adapter for CAP.

This package lets applications reuse an existing `@nestjs/microservices`
client registration while CAP keeps outbox/inbox state, retries, and dashboard
visibility.

## Usage Shape

```ts
import { NestjsMicroservicesTransportModule } from '@mikara89/cap-transport-nestjs-microservices';

const transport = NestjsMicroservicesTransportModule.forRoot({
  clientToken: 'ORDERS_CLIENT',
  publishTimeoutMs: 5000,
});
```

Register the returned dynamic module with `CapModule.forRoot({ imports })`
alongside a storage adapter.

For inbound messages, wire your Nest microservice handler to the CAP bridge:

```ts
@EventPattern('order.created')
handleOrderCreated(message: unknown) {
  return this.capBridge.dispatch('order.created', 'orders-worker', message);
}
```

This adapter has one portable `ClientProxy` data body, so messages with CAP
headers or identity use the core version-1 envelope:

```json
{
  "$cap": { "kind": "cap.message", "version": 1 },
  "payload": { "orderId": "o1" },
  "headers": {
    "traceId": "trace-1",
    "cap-message-id": "message-1"
  }
}
```

Messages without CAP headers or identity remain raw business payloads. The
bridge forwards the complete body to core's authoritative decoder, so ordinary
objects containing `payload` are not shape-unwrapped. This replaces the old
unversioned `{ payload, headers, metadata }` adapter body; producers and
consumers using different package versions must be upgraded together.

`ClientProxy.emit()` completion means the configured Nest client accepted the
emit operation. It is not a portable broker-durable acknowledgment guarantee.
Use broker-specific CAP transports when durable send acknowledgment semantics
are required.

## Documentation

- [Repository overview](../../README.md)
- [API reference](../../docs/api/README.md)
- [Package export surface](../../docs/package-exports.md)
- [Adapters](../../docs/adapters.md)
- [Architecture](../../docs/architecture.md)
- [Roadmap](../../docs/roadmap.md)
- [ADRs](../../docs/adr/README.md)
