# CAP Examples

These examples are small TypeScript snippets that compile against the workspace
source packages. They are not standalone applications and they do not open
database or broker connections when imported.

Run the compile check from the repository root:

```sh
npm run examples:check
```

## Examples

- [in-memory.ts](in-memory.ts) - local `CapModule.forInMemory()` setup with a
  publisher and subscriber.
- [mikroorm-azure-servicebus.ts](mikroorm-azure-servicebus.ts) - production-style
  MikroORM storage and Azure Service Bus transport registration.
- [knex-storage.ts](knex-storage.ts) - framework-free Knex storage setup and
  explicit transaction publishing.
- [typeorm-storage.ts](typeorm-storage.ts) - framework-free TypeORM storage
  setup and explicit `EntityManager` transaction publishing.
- [prisma-storage.ts](prisma-storage.ts) - model-free Prisma storage setup and
  interactive transaction client publishing.
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
