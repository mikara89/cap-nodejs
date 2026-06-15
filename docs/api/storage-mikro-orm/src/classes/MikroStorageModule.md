[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [storage-mikro-orm/src](../README.md) / MikroStorageModule

# Class: MikroStorageModule

Defined in: [storage-mikro-orm/src/mikro-storage.module.ts:40](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/mikro-storage.module.ts#L40)

NestJS module providing MikroORM-based storage adapters for CAP.

Usage:
```ts
import { CapModule } from '@mikara89/cap-nest';
import { MikroStorageModule } from '@mikara89/mikroorm-storage';

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

> **get** `static` **providers**(): `ClassProvider`\<`any`\>[]

Defined in: [storage-mikro-orm/src/mikro-storage.module.ts:41](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/mikro-storage.module.ts#L41)

##### Returns

`ClassProvider`\<`any`\>[]
