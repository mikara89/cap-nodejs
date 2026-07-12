[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-nest/src](../README.md) / DiscoveredSubscription

# Interface: DiscoveredSubscription

Defined in: [cap-nest/src/cap/decorators/cap-subscribe.decorator.ts:141](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/decorators/cap-subscribe.decorator.ts#L141)

Shape returned by `discoverSubscriptions`

## Properties

### filter?

> `optional` **filter?**: (`payload`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [cap-nest/src/cap/decorators/cap-subscribe.decorator.ts:144](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/decorators/cap-subscribe.decorator.ts#L144)

#### Parameters

##### payload

`unknown`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

***

### group?

> `optional` **group?**: `string`

Defined in: [cap-nest/src/cap/decorators/cap-subscribe.decorator.ts:143](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/decorators/cap-subscribe.decorator.ts#L143)

***

### handler

> **handler**: (`payload`, `headers?`) => `Promise`\<`unknown`\>

Defined in: [cap-nest/src/cap/decorators/cap-subscribe.decorator.ts:145](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/decorators/cap-subscribe.decorator.ts#L145)

#### Parameters

##### payload

`unknown`

##### headers?

[`CapHeaders`](../type-aliases/CapHeaders.md)

#### Returns

`Promise`\<`unknown`\>

***

### topic

> **topic**: `string`

Defined in: [cap-nest/src/cap/decorators/cap-subscribe.decorator.ts:142](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/decorators/cap-subscribe.decorator.ts#L142)
