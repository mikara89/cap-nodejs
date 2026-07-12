[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-nest/src](../README.md) / InitOptions

# Interface: InitOptions

Defined in: [cap-nest/src/cap/abstractions/initializer.interface.ts:8](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/abstractions/initializer.interface.ts#L8)

Initialization options for adapters.

- `autoInit`: shorthand to request default initialization behavior.
- `createSchema`: storage adapters can create database schema/tables.
- `createQueues`: transport adapters can create queues/topics/subscriptions.

## Properties

### autoInit?

> `optional` **autoInit?**: `boolean`

Defined in: [cap-nest/src/cap/abstractions/initializer.interface.ts:9](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/abstractions/initializer.interface.ts#L9)

***

### createQueues?

> `optional` **createQueues?**: `boolean`

Defined in: [cap-nest/src/cap/abstractions/initializer.interface.ts:11](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/abstractions/initializer.interface.ts#L11)

***

### createSchema?

> `optional` **createSchema?**: `boolean`

Defined in: [cap-nest/src/cap/abstractions/initializer.interface.ts:10](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/abstractions/initializer.interface.ts#L10)
