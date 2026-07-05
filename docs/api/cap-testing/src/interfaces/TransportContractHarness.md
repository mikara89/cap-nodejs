[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-testing/src](../README.md) / TransportContractHarness

# Interface: TransportContractHarness

Defined in: [cap-testing/src/contracts/transport-contract.ts:24](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-testing/src/contracts/transport-contract.ts#L24)

## Properties

### activePublisherResources?

> `optional` **activePublisherResources?**: () => `number`

Defined in: [cap-testing/src/contracts/transport-contract.ts:28](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-testing/src/contracts/transport-contract.ts#L28)

#### Returns

`number`

***

### activeSubscriberResources?

> `optional` **activeSubscriberResources?**: () => `number`

Defined in: [cap-testing/src/contracts/transport-contract.ts:29](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-testing/src/contracts/transport-contract.ts#L29)

#### Returns

`number`

***

### deliver

> **deliver**: (`delivery`) => `Promise`\<`void`\>

Defined in: [cap-testing/src/contracts/transport-contract.ts:27](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-testing/src/contracts/transport-contract.ts#L27)

#### Parameters

##### delivery

[`TransportContractDelivery`](TransportContractDelivery.md)

#### Returns

`Promise`\<`void`\>

***

### failNextPublish

> **failNextPublish**: (`error`) => `void`

Defined in: [cap-testing/src/contracts/transport-contract.ts:26](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-testing/src/contracts/transport-contract.ts#L26)

#### Parameters

##### error

`Error`

#### Returns

`void`

***

### publishedMessages

> **publishedMessages**: () => readonly [`TransportContractPublishedMessage`](TransportContractPublishedMessage.md)[]

Defined in: [cap-testing/src/contracts/transport-contract.ts:25](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-testing/src/contracts/transport-contract.ts#L25)

#### Returns

readonly [`TransportContractPublishedMessage`](TransportContractPublishedMessage.md)[]
