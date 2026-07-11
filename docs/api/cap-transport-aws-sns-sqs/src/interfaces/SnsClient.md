[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-transport-aws-sns-sqs/src](../README.md) / SnsClient

# Interface: SnsClient

Defined in: cap-transport-aws-sns-sqs/src/aws-types.ts:5

## Methods

### destroy()

> **destroy**(): `void`

Defined in: cap-transport-aws-sns-sqs/src/aws-types.ts:10

#### Returns

`void`

***

### send()

> **send**(`command`): `Promise`\<\{ `MessageId?`: `string`; `SequenceNumber?`: `string`; \}\>

Defined in: cap-transport-aws-sns-sqs/src/aws-types.ts:6

#### Parameters

##### command

###### input

`PublishCommandInput`

#### Returns

`Promise`\<\{ `MessageId?`: `string`; `SequenceNumber?`: `string`; \}\>
