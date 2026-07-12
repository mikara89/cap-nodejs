[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-core/src](../README.md) / CapSubscribeOptions

# Interface: CapSubscribeOptions\<T\>

Defined in: [cap-core/src/models/cap-options.ts:11](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-options.ts#L11)

## Type Parameters

### T

`T` = `unknown`

## Properties

### dto?

> `optional` **dto?**: () => `T`

Defined in: [cap-core/src/models/cap-options.ts:14](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-options.ts#L14)

#### Returns

`T`

***

### filter?

> `optional` **filter?**: (`payload`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [cap-core/src/models/cap-options.ts:15](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-options.ts#L15)

#### Parameters

##### payload

`T`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

***

### group?

> `optional` **group?**: `string`

Defined in: [cap-core/src/models/cap-options.ts:13](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-options.ts#L13)

***

### topic

> **topic**: `string`

Defined in: [cap-core/src/models/cap-options.ts:12](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-options.ts#L12)
