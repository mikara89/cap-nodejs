# Adapter Implementation Plan

This document outlines the plan to implement production-ready storage and
transport adapters for the CAP library.

## Storage Adapter: MikroORM

**Package**: `@cap/mikroorm-storage` (or `libs/storage-mikro-orm/`)

### Overview

Implement `IPublishStorage` and `IReceivedStorage` using MikroORM for relational
database persistence (PostgreSQL, MySQL, SQLite).

### Implementation Steps

1. **Create package structure**
   ```
   libs/storage-mikro-orm/
     src/
       entities/
         cap-publish.entity.ts      # MikroORM entity for outbox
         cap-received.entity.ts     # MikroORM entity for inbox
       storage/
         mikro-publish-storage.ts   # Implements IPublishStorage
         mikro-received-storage.ts  # Implements IReceivedStorage
       mikro-storage.module.ts      # NestJS module exporting providers
       index.ts
     tsconfig.lib.json
     package.json
   ```

2. **Define entities**
   - `CapPublishEntity`:
     - `id: string` (UUID, PK)
     - `topic: string`
     - `payload: object` (JSON column)
     - `headers?: object` (JSON column)
     - `status?: 'published' | 'failed'`
     - `retryCount: number`
     - `createdAt: Date`
     - Indexes: `status`, `createdAt` for efficient outbox queries

   - `CapReceivedEntity`:
     - `id: string` (UUID, PK)
     - `topic: string`
     - `group: string`
     - `payload: object` (JSON column)
     - `headers?: object` (JSON column)
     - `processed: boolean`
     - `retryCount: number`
     - `nextRetry?: Date`
     - `createdAt: Date`
     - Indexes: `processed`, `nextRetry` for retry queries

3. **Implement storage classes**
   - `MikroPublishStorage`:
     - Inject `EntityManager` or `Repository<CapPublishEntity>`
     - `savePublish()`: insert new outbox record
     - `markPublished()`: update status to 'published'
     - `getUnpublished()`: query WHERE status IS NULL OR (status = 'failed' AND
       retryCount < limit)

   - `MikroReceivedStorage`:
     - Inject `EntityManager` or `Repository<CapReceivedEntity>`
     - `saveReceived()`: insert new inbox record
     - `markProcessed()`: update processed = true
     - `scheduleRetry()`: update retryCount and nextRetry
     - `getRetryDue()`: query WHERE processed = false AND nextRetry <= NOW()

4. **Create module**
   ```ts
   @Module({
     imports: [
       MikroOrmModule.forFeature([CapPublishEntity, CapReceivedEntity]),
     ],
     providers: [
       { provide: PUBLISH_STORAGE, useClass: MikroPublishStorage },
       { provide: RECEIVED_STORAGE, useClass: MikroReceivedStorage },
     ],
     exports: [PUBLISH_STORAGE, RECEIVED_STORAGE],
   })
   export class MikroStorageModule {}
   ```

5. **Testing**
   - Unit tests with mocked EntityManager
   - Integration tests using an in-memory SQLite database
   - Test retry logic, concurrent access, and transaction handling

6. **Documentation**
   - Usage example in main app
   - Migration scripts or schema auto-generation notes
   - Performance tuning (indexes, batch size)

---

## Transport Adapter: Azure Service Bus

**Package**: `@cap/azure-servicebus-transport` (or
`libs/transport-azure-servicebus/`)

### Overview

Implement `IPublisher` and `ISubscriber` using Azure Service Bus
topics/subscriptions for reliable message delivery.

### Implementation Steps

1. **Create package structure**
   ```
   libs/transport-azure-servicebus/
     src/
       transport/
         servicebus-publisher.ts    # Implements IPublisher
         servicebus-subscriber.ts   # Implements ISubscriber
       servicebus-transport.module.ts
       servicebus.config.ts         # Config interface
       index.ts
     tsconfig.lib.json
     package.json
   ```

2. **Dependencies**
   - `@azure/service-bus` — official Azure SDK for Service Bus

3. **Configuration interface**
   ```ts
   export interface ServiceBusConfig {
     connectionString: string;
     topicPrefix?: string; // e.g., 'cap-'
     subscriptionPrefix?: string; // e.g., 'cap-sub-'
     maxConcurrentCalls?: number;
   }
   ```

4. **Implement publisher**
   - `ServiceBusPublisher`:
     - Inject `ServiceBusClient` (created from connection string)
     - `emit(topic, payload)`:
       - Get or create `ServiceBusSender` for the topic
       - Send message with `body: payload` and custom properties for headers
       - Handle errors and log failures

5. **Implement subscriber**
   - `ServiceBusSubscriber`:
     - Inject `ServiceBusClient`
     - `consume(topic, group, onMessage)`:
       - Ensure topic exists (create if needed, or assume pre-created)
       - Ensure subscription exists for the group (create if needed)
       - Create `ServiceBusReceiver` for topic/subscription
       - Subscribe to messages and invoke `onMessage(payload)`
       - Auto-complete messages on success, abandon on failure for redelivery

6. **Create module**
   ```ts
   @Module({
     providers: [
       {
         provide: "SERVICEBUS_CLIENT",
         useFactory: (config: ServiceBusConfig) =>
           new ServiceBusClient(config.connectionString),
         inject: ["SERVICEBUS_CONFIG"],
       },
       { provide: PUBLISHER, useClass: ServiceBusPublisher },
       { provide: SUBSCRIBER, useClass: ServiceBusSubscriber },
     ],
     exports: [PUBLISHER, SUBSCRIBER],
   })
   export class ServiceBusTransportModule {
     static forRoot(config: ServiceBusConfig): DynamicModule {
       return {
         module: ServiceBusTransportModule,
         providers: [
           { provide: "SERVICEBUS_CONFIG", useValue: config },
           // ... other providers
         ],
         exports: [PUBLISHER, SUBSCRIBER],
       };
     }
   }
   ```

7. **Error handling & retries**
   - Use Service Bus dead-letter queues for failed messages after max delivery
     attempts
   - Implement reconnection logic if connection drops
   - Log errors with correlation IDs for tracing

8. **Testing**
   - Unit tests with mocked `ServiceBusClient`
   - Integration tests using Azure Service Bus emulator or test instance
   - Test topic/subscription creation, message sending, receiving, and error
     scenarios

9. **Documentation**
   - Setup guide (Azure portal, connection string)
   - Usage example with
     `CapModule.forAdapters(MikroStorageModule, ServiceBusTransportModule.forRoot(config))`
   - Best practices (topic naming, subscription filters, message size limits)

---

## Integration Example

After implementing both adapters, usage in the main app:

```ts
import { Module } from "@nestjs/common";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { CapModule } from "@cap/cap-nest";
import { MikroStorageModule } from "@cap/mikroorm-storage";
import { ServiceBusTransportModule } from "@cap/azure-servicebus-transport";

@Module({
  imports: [
    MikroOrmModule.forRoot({
      type: "postgresql",
      host: "localhost",
      dbName: "capdb",
      // ... other options
    }),
    CapModule.forAdapters(
      MikroStorageModule,
      ServiceBusTransportModule.forRoot({
        connectionString: process.env.AZURE_SERVICEBUS_CONNECTION_STRING,
        topicPrefix: "cap-",
      }),
    ),
  ],
})
export class AppModule {}
```

---

## Timeline & Milestones

1. **Phase 1: MikroORM Storage**
   - Week 1: Entity definitions and basic repository implementation
   - Week 2: Unit and integration tests, documentation

2. **Phase 2: Azure Service Bus Transport**
   - Week 3: Publisher and subscriber implementation
   - Week 4: Error handling, retries, integration tests, documentation

3. **Phase 3: End-to-End Testing**
   - Week 5: Integration test with both adapters, performance testing, CI setup

4. **Phase 4: Production Readiness**
   - Week 6: Security review, load testing, final documentation and examples

---

## Future Considerations

- Add support for other databases (MongoDB via TypeORM or Mongoose)
- Add alternative transports (RabbitMQ, Kafka, AWS SQS/SNS)
- Add observability (metrics, tracing with OpenTelemetry)
- Add schema validation for messages (JSON Schema, Zod, or class-validator DTOs)
