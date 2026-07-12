[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-nest/src](../README.md) / AdapterInitializer

# Abstract Class: AdapterInitializer

Defined in: [cap-nest/src/cap/abstractions/initializer.interface.ts:19](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/abstractions/initializer.interface.ts#L19)

Simple abstract class adapters may implement to perform one-time
initialization (schema creation, queue setup, etc.). Keeping this
minimal so adapters can opt-in easily.

## Constructors

### Constructor

> **new AdapterInitializer**(): `AdapterInitializer`

#### Returns

`AdapterInitializer`

## Methods

### initialize()

> `abstract` **initialize**(`options?`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/abstractions/initializer.interface.ts:20](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/abstractions/initializer.interface.ts#L20)

#### Parameters

##### options?

[`InitOptions`](../interfaces/InitOptions.md)

#### Returns

`Promise`\<`void`\>
