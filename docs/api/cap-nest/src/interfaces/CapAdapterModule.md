[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / CapAdapterModule

# Interface: CapAdapterModule

Defined in: [cap-nest/src/cap/cap.module.ts:58](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L58)

Helper for adapter packages:
  CapModule.forAdapters( TypeOrmStorageModule, RabbitTransportModule )
Reads the `providers` array exported by the adapter module
so callers don’t need to manually copy-paste them.

## Properties

### providers

> **providers**: `Provider`[]

Defined in: [cap-nest/src/cap/cap.module.ts:59](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L59)
