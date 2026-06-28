[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-testing/src](../README.md) / TransportContractHarness

# Interface: TransportContractHarness

Defined in: cap-testing/src/contracts/transport-contract.ts:24

## Properties

### activePublisherResources?

> `optional` **activePublisherResources?**: () => `number`

Defined in: cap-testing/src/contracts/transport-contract.ts:28

#### Returns

`number`

***

### activeSubscriberResources?

> `optional` **activeSubscriberResources?**: () => `number`

Defined in: cap-testing/src/contracts/transport-contract.ts:29

#### Returns

`number`

***

### deliver

> **deliver**: (`delivery`) => `Promise`\<`void`\>

Defined in: cap-testing/src/contracts/transport-contract.ts:27

#### Parameters

##### delivery

[`TransportContractDelivery`](TransportContractDelivery.md)

#### Returns

`Promise`\<`void`\>

***

### failNextPublish

> **failNextPublish**: (`error`) => `void`

Defined in: cap-testing/src/contracts/transport-contract.ts:26

#### Parameters

##### error

`Error`

#### Returns

`void`

***

### publishedMessages

> **publishedMessages**: () => readonly [`TransportContractPublishedMessage`](TransportContractPublishedMessage.md)[]

Defined in: cap-testing/src/contracts/transport-contract.ts:25

#### Returns

readonly [`TransportContractPublishedMessage`](TransportContractPublishedMessage.md)[]
