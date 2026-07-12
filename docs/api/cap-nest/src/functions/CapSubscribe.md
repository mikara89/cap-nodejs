[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-nest/src](../README.md) / CapSubscribe

# Function: CapSubscribe()

> **CapSubscribe**\<`T`\>(`opts`, `maybeGroup?`): `MethodDecorator`

Defined in: [cap-nest/src/cap/decorators/cap-subscribe.decorator.ts:42](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/decorators/cap-subscribe.decorator.ts#L42)

Decorate a method so the CAP worker knows it should be invoked
when a message on `topic` (optionally `group`) arrives.

```ts
@CapSubscribe({ topic: 'user.created', group: 'mail-service' })
async handleUserCreated(evt: UserCreated) { ... }
```

## Type Parameters

### T

`T` = `unknown`

## Parameters

### opts

`string` \| [`CapSubscribeOptions`](../interfaces/CapSubscribeOptions.md)\<`T`\>

### maybeGroup?

`string`

## Returns

`MethodDecorator`
