[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / InitOptions

# Interface: InitOptions

Defined in: cap-nest/src/cap/abstractions/initializer.interface.ts:8

Initialization options for adapters.

- `autoInit`: shorthand to request default initialization behavior.
- `createSchema`: storage adapters can create database schema/tables.
- `createQueues`: transport adapters can create queues/topics/subscriptions.

## Properties

### autoInit?

> `optional` **autoInit?**: `boolean`

Defined in: cap-nest/src/cap/abstractions/initializer.interface.ts:9

***

### createQueues?

> `optional` **createQueues?**: `boolean`

Defined in: cap-nest/src/cap/abstractions/initializer.interface.ts:11

***

### createSchema?

> `optional` **createSchema?**: `boolean`

Defined in: cap-nest/src/cap/abstractions/initializer.interface.ts:10
