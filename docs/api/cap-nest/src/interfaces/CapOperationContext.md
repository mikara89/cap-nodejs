[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-nest/src](../README.md) / CapOperationContext

# Interface: CapOperationContext\<TTx\>

Defined in: cap-core/dist/models/cap-operation-context.d.ts:1

## Type Parameters

### TTx

`TTx` = `unknown`

## Properties

### afterCommit?

> `optional` **afterCommit?**: (`fn`) => `void`

Defined in: cap-core/dist/models/cap-operation-context.d.ts:3

#### Parameters

##### fn

() => `void` \| `Promise`\<`void`\>

#### Returns

`void`

***

### afterRollback?

> `optional` **afterRollback?**: (`fn`) => `void`

Defined in: cap-core/dist/models/cap-operation-context.d.ts:4

#### Parameters

##### fn

(`error`) => `void` \| `Promise`\<`void`\>

#### Returns

`void`

***

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `unknown`\>

Defined in: cap-core/dist/models/cap-operation-context.d.ts:5

***

### tx?

> `optional` **tx?**: `TTx`

Defined in: cap-core/dist/models/cap-operation-context.d.ts:2
