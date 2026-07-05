# CAP Examples

These examples are small TypeScript snippets that compile against the workspace
source packages. They are not standalone applications and they do not open
database or broker connections when imported.

Run the compile check from the repository root:

```sh
npm run examples:check
```

## Examples

- [transport/rabbitmq.ts](transport/rabbitmq.ts) - framework-neutral RabbitMQ
  publisher/subscriber lifecycle and group subscription wiring.
- [transport/kafka.ts](transport/kafka.ts) - framework-neutral Kafka
  publisher/subscriber with consumer groups and success-only offset commits.
- [in-memory.ts](in-memory.ts) - local `CapModule.forInMemory()` setup with a
  publisher and subscriber.
- [mikroorm-azure-servicebus.ts](mikroorm-azure-servicebus.ts) - production-style
  MikroORM storage and Azure Service Bus transport registration.
- [storage/knex.ts](storage/knex.ts) - framework-free Knex schema and engine
  setup with explicit transaction and operation-context publishing.
- [storage/typeorm.ts](storage/typeorm.ts) - framework-free TypeORM schema and
  engine setup with explicit `EntityManager` and operation-context publishing.
- [storage/prisma.ts](storage/prisma.ts) - model-free raw-SQL Prisma schema and
  engine setup with explicit transaction-client and operation-context
  publishing.
- [dashboard.ts](dashboard.ts) - dashboard registration with a local-only sample
  guard.
- [nestjs-microservices-bridge.ts](nestjs-microservices-bridge.ts) - publishing
  through a NestJS `ClientProxy` and dispatching inbound messages into CAP.

## Environment Variables

The production-style example references these variables inside registration
helpers:

- `DB_NAME`
- `AZURE_SERVICEBUS_CONNECTION_STRING`

Use a secret manager or environment-specific configuration in real
applications. Do not commit credentials.
