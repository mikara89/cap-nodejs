# @mikara89/azure-servicebus-transport

Azure Service Bus transport adapter for CAP.

This package provides:

- `ServiceBusTransportModule`
- `ServiceBusPublisher`
- `ServiceBusSubscriber`
- topic/subscription mode
- queue mode
- optional queue/topic provisioning during initialization

## Usage Shape

```ts
import { ServiceBusTransportModule } from '@mikara89/azure-servicebus-transport';

const serviceBusTransport = ServiceBusTransportModule.forRoot({
  connectionString: process.env.AZURE_SERVICEBUS_CONNECTION_STRING!,
  topicPrefix: 'cap-',
  subscriptionPrefix: 'sub-',
});
```

Register the returned dynamic module with `CapModule.forAdapters(...)` alongside
a storage adapter.

## Notes

- Use environment variables or a secret manager for connection strings.
- Do not commit real Service Bus credentials.
- Prefer pre-created broker resources in production unless automatic
  provisioning is explicitly desired.

## Documentation

- [Repository overview](../../README.md)
- [API reference](../../docs/api/README.md)
- [Package export surface](../../docs/package-exports.md)
- [Adapters](../../docs/adapters.md)
- [Architecture](../../docs/architecture.md)
- [Roadmap](../../docs/roadmap.md)
- [ADRs](../../docs/adr/README.md)
