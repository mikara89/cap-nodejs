[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-core/src](../README.md) / isLegacyTransactionalPublishStorage

# Function: isLegacyTransactionalPublishStorage()

> **isLegacyTransactionalPublishStorage**\<`TTx`\>(`storage`): `storage is TransactionalPublishStoragePort<TTx> & { savePublishWithTx: (event: CapPublishEvent<T>, tx: TTx) => Promise<string> }`

Defined in: cap-core/src/ports/publish-storage.port.ts:66

## Type Parameters

### TTx

`TTx` = `unknown`

## Parameters

### storage

[`PublishStoragePort`](../interfaces/PublishStoragePort.md)\<`TTx`\>

## Returns

`storage is TransactionalPublishStoragePort<TTx> & { savePublishWithTx: (event: CapPublishEvent<T>, tx: TTx) => Promise<string> }`
