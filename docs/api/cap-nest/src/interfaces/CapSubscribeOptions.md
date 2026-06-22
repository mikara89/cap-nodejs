[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / CapSubscribeOptions

# Interface: CapSubscribeOptions\<T\>

Defined in: cap-nest/src/cap/decorators/cap-subscribe.decorator.ts:20

Options recognized by `@CapSubscribe`.

* `topic`  - logical topic / exchange / subject.
* `group`  - queue / consumer-group name. Omit if you want a
             broadcast queue that every subscriber receives.
* `filter` - optional user-defined predicate that can short-circuit
             delivery before your handler executes.

## Type Parameters

### T

`T` = `unknown`

## Properties

### dto?

> `optional` **dto?**: () => `T`

Defined in: cap-nest/src/cap/decorators/cap-subscribe.decorator.ts:23

#### Returns

`T`

***

### filter?

> `optional` **filter?**: (`payload`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: cap-nest/src/cap/decorators/cap-subscribe.decorator.ts:24

#### Parameters

##### payload

`T`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

***

### group?

> `optional` **group?**: `string`

Defined in: cap-nest/src/cap/decorators/cap-subscribe.decorator.ts:22

***

### topic

> **topic**: `string`

Defined in: cap-nest/src/cap/decorators/cap-subscribe.decorator.ts:21
