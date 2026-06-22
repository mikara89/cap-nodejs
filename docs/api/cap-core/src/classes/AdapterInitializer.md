[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-core/src](../README.md) / AdapterInitializer

# Abstract Class: AdapterInitializer

Defined in: cap-core/src/ports/initializer.port.ts:18

Simple abstract class adapters may implement to perform one-time
initialization such as schema creation or queue setup.

## Constructors

### Constructor

> **new AdapterInitializer**(): `AdapterInitializer`

#### Returns

`AdapterInitializer`

## Methods

### initialize()

> `abstract` **initialize**(`options?`): `Promise`\<`void`\>

Defined in: cap-core/src/ports/initializer.port.ts:19

#### Parameters

##### options?

[`InitOptions`](../interfaces/InitOptions.md)

#### Returns

`Promise`\<`void`\>
