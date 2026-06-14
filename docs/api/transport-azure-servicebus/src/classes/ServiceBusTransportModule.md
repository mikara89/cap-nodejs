[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [transport-azure-servicebus/src](../README.md) / ServiceBusTransportModule

# Class: ServiceBusTransportModule

Defined in: [transport-azure-servicebus/src/servicebus-transport.module.ts:32](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-azure-servicebus/src/servicebus-transport.module.ts#L32)

NestJS module providing Azure Service Bus transport adapters for CAP.

Usage:
```ts
import { CapModule } from '@cap/cap-nest';
import { ServiceBusTransportModule } from '@cap/azure-servicebus-transport';

@Module({
  imports: [
    CapModule.forAdapters(
      storageModule,
      ServiceBusTransportModule.forRoot({
        connectionString: process.env.AZURE_SERVICEBUS_CONNECTION_STRING!,
        topicPrefix: 'cap-',
      }),
    ),
  ],
})
export class AppModule {}
```

## Constructors

### Constructor

> **new ServiceBusTransportModule**(): `ServiceBusTransportModule`

#### Returns

`ServiceBusTransportModule`

## Methods

### forRoot()

> `static` **forRoot**(`config`): `DynamicModule`

Defined in: [transport-azure-servicebus/src/servicebus-transport.module.ts:33](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-azure-servicebus/src/servicebus-transport.module.ts#L33)

#### Parameters

##### config

[`ServiceBusConfig`](../interfaces/ServiceBusConfig.md)

#### Returns

`DynamicModule`
