# Azure Service Bus Transport Adapter

Azure Service Bus transport implementation for the CAP NestJS library. Provides
reliable messaging using Azure Service Bus topics and subscriptions.

## Installation

```bash
npm install @cap/transport-azure-servicebus @azure/service-bus
```

## Usage

```ts
import { Module } from "@nestjs/common";
import { CapModule } from "@cap/cap-nest";
import { ServiceBusTransportModule } from "@cap/transport-azure-servicebus";

@Module({
    imports: [
        CapModule.forAdapters(
            storageModule,
            ServiceBusTransportModule.forRoot({
                connectionString: process.env
                    .AZURE_SERVICEBUS_CONNECTION_STRING!,
                topicPrefix: "cap-",
                subscriptionPrefix: "cap-sub-",
            }),
        ),
    ],
})
export class AppModule {}
```

## Configuration

### Connection String

Get your connection string from Azure Portal:

1. Navigate to your Service Bus namespace
2. Go to **Shared access policies**
3. Select a policy (or create a new one with Send and Listen permissions)
4. Copy the **Primary Connection String**

### Options

- `connectionString` (required): Azure Service Bus connection string
- `topicPrefix` (optional): Prefix for topic names (default: 'cap-')
- `subscriptionPrefix` (optional): Prefix for subscription names (default:
  'cap-sub-')
- `maxConcurrentCalls` (optional): Max concurrent message handlers (default: 1)

## Topic and Subscription Management

The adapter automatically:

- Creates topics when messages are published (if they don't exist)
- Creates subscriptions when consumers register (if they don't exist)
- Uses topic name format: `{topicPrefix}{topic}`
- Uses subscription name format: `{subscriptionPrefix}{group}`

You can also pre-create topics and subscriptions in the Azure Portal.

## Error Handling

- Messages are automatically retried by Service Bus if handler fails
- After max delivery count, messages move to the dead-letter queue
- Configure max delivery count and lock duration in Azure Portal

## Best Practices

1. **Security**: Use Managed Identity or SAS tokens with least privilege
2. **Naming**: Keep topic/subscription names under 260 characters
3. **Message Size**: Limit payload to 256 KB (standard) or 1 MB (premium)
4. **Sessions**: Enable sessions for ordered message processing
5. **Monitoring**: Use Azure Monitor for metrics and alerts

## Example with Environment Variables

```ts
ServiceBusTransportModule.forRoot({
    connectionString: process.env.AZURE_SERVICEBUS_CONNECTION_STRING!,
    topicPrefix: process.env.CAP_TOPIC_PREFIX || "cap-",
});
```

## Local Development

Use Azure Service Bus Emulator or create a development namespace in Azure with a
basic tier for cost savings.
