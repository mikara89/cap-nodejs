# @mikara89/nestjs-microservices-transport

NestJS `ClientProxy` transport adapter for CAP.

This package lets applications reuse an existing `@nestjs/microservices`
client registration while CAP keeps outbox/inbox state, retries, and dashboard
visibility.

## Usage Shape

```ts
import { NestjsMicroservicesTransportModule } from '@mikara89/nestjs-microservices-transport';

const transport = NestjsMicroservicesTransportModule.forRoot({
  clientToken: 'ORDERS_CLIENT',
  publishTimeoutMs: 5000,
});
```

Register the returned dynamic module with `CapModule.forAdapters(...)` alongside
a storage adapter.

For inbound messages, wire your Nest microservice handler to the CAP bridge:

```ts
@EventPattern('order.created')
handleOrderCreated(message: unknown) {
  return this.capBridge.dispatch('order.created', 'orders-worker', message);
}
```

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
