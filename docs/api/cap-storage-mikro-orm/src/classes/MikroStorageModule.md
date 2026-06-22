[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-storage-mikro-orm/src](../README.md) / MikroStorageModule

# Class: MikroStorageModule

Defined in: cap-storage-mikro-orm/src/nest/mikro-storage.module.ts:46

NestJS module providing MikroORM-based storage adapters for CAP.

Usage:
```ts
import { MikroStorageModule } from '@mikara89/cap-storage-mikro-orm';

@Module({
  imports: [
    MikroOrmModule.forRoot({ ... }),
    CapModule.forRoot({ imports: [MikroStorageModule, transportModule] }),
  ],
})
export class AppModule {}
```

## Constructors

### Constructor

> **new MikroStorageModule**(): `MikroStorageModule`

#### Returns

`MikroStorageModule`

## Accessors

### providers

#### Get Signature

> **get** `static` **providers**(): `Provider`[]

Defined in: cap-storage-mikro-orm/src/nest/mikro-storage.module.ts:47

##### Returns

`Provider`[]
