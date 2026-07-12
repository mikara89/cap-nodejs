[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-core/src](../README.md) / CapOperationContext

# Interface: CapOperationContext\<TTx\>

Defined in: [cap-core/src/models/cap-operation-context.ts:1](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-operation-context.ts#L1)

## Type Parameters

### TTx

`TTx` = `unknown`

## Properties

### afterCommit?

> `optional` **afterCommit?**: (`fn`) => `void`

Defined in: [cap-core/src/models/cap-operation-context.ts:3](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-operation-context.ts#L3)

#### Parameters

##### fn

() => `void` \| `Promise`\<`void`\>

#### Returns

`void`

***

### afterRollback?

> `optional` **afterRollback?**: (`fn`) => `void`

Defined in: [cap-core/src/models/cap-operation-context.ts:4](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-operation-context.ts#L4)

#### Parameters

##### fn

(`error`) => `void` \| `Promise`\<`void`\>

#### Returns

`void`

***

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `unknown`\>

Defined in: [cap-core/src/models/cap-operation-context.ts:5](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-operation-context.ts#L5)

***

### tx?

> `optional` **tx?**: `TTx`

Defined in: [cap-core/src/models/cap-operation-context.ts:2](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-operation-context.ts#L2)
