[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-core/src](../README.md) / AdapterInitializer

# Abstract Class: AdapterInitializer

Defined in: [cap-core/src/ports/initializer.port.ts:18](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/initializer.port.ts#L18)

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

Defined in: [cap-core/src/ports/initializer.port.ts:19](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/initializer.port.ts#L19)

#### Parameters

##### options?

[`InitOptions`](../interfaces/InitOptions.md)

#### Returns

`Promise`\<`void`\>
