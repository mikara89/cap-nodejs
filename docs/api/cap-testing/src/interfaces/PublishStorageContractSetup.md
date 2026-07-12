[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-testing/src](../README.md) / PublishStorageContractSetup

# Interface: PublishStorageContractSetup\<TTx\>

Defined in: [cap-testing/src/contracts/publish-storage-contract.ts:12](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-testing/src/contracts/publish-storage-contract.ts#L12)

## Type Parameters

### TTx

`TTx` = `unknown`

## Properties

### cleanup

> **cleanup**: () => `Promise`\<`void`\>

Defined in: [cap-testing/src/contracts/publish-storage-contract.ts:15](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-testing/src/contracts/publish-storage-contract.ts#L15)

#### Returns

`Promise`\<`void`\>

***

### storage

> **storage**: [`PublishStoragePort`](../../../cap-nest/src/interfaces/PublishStoragePort.md)\<`TTx`\>

Defined in: [cap-testing/src/contracts/publish-storage-contract.ts:13](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-testing/src/contracts/publish-storage-contract.ts#L13)

***

### transaction?

> `optional` **transaction?**: [`CapTransactionManagerPort`](../../../cap-nest/src/interfaces/CapTransactionManagerPort.md)\<`TTx`\>

Defined in: [cap-testing/src/contracts/publish-storage-contract.ts:14](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-testing/src/contracts/publish-storage-contract.ts#L14)
