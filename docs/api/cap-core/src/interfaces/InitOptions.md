[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-core/src](../README.md) / InitOptions

# Interface: InitOptions

Defined in: cap-core/src/ports/initializer.port.ts:8

Initialization options for adapters.

- `autoInit`: shorthand to request default initialization behavior.
- `createSchema`: storage adapters can create database schema/tables.
- `createQueues`: transport adapters can create queues/topics/subscriptions.

## Properties

### autoInit?

> `optional` **autoInit?**: `boolean`

Defined in: cap-core/src/ports/initializer.port.ts:9

***

### createQueues?

> `optional` **createQueues?**: `boolean`

Defined in: cap-core/src/ports/initializer.port.ts:11

***

### createSchema?

> `optional` **createSchema?**: `boolean`

Defined in: cap-core/src/ports/initializer.port.ts:10
