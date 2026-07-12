[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-transport-aws-sns-sqs/src](../README.md) / AwsSnsSqsTopology

# Class: AwsSnsSqsTopology

Defined in: [cap-transport-aws-sns-sqs/src/aws-topology.ts:20](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-aws-sns-sqs/src/aws-topology.ts#L20)

Optional topology manager for SNS→SQS subscription setup.

When `autoProvision` is enabled and topic/queue names are provided
(instead of raw ARNs/URLs), this manager can create the SNS topic,
SQS queue, and the subscription between them.

This is conservative by design:
- It only runs when explicitly opted in via `autoProvision: true`.
- It only acts on names (not raw ARNs/URLs).
- It does not delete resources on close.

## Constructors

### Constructor

> **new AwsSnsSqsTopology**(`logger?`): `AwsSnsSqsTopology`

Defined in: [cap-transport-aws-sns-sqs/src/aws-topology.ts:23](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-aws-sns-sqs/src/aws-topology.ts#L23)

#### Parameters

##### logger?

[`CapLogger`](../../../cap-nest/src/interfaces/CapLogger.md)

#### Returns

`AwsSnsSqsTopology`

## Methods

### ensureQueue()

> **ensureQueue**(`sqsClient`, `queueName`): `Promise`\<`string`\>

Defined in: [cap-transport-aws-sns-sqs/src/aws-topology.ts:50](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-aws-sns-sqs/src/aws-topology.ts#L50)

#### Parameters

##### sqsClient

###### send

##### queueName

`string`

#### Returns

`Promise`\<`string`\>

***

### ensureSubscription()

> **ensureSubscription**(`snsClient`, `topicArn`, `queueArn`): `Promise`\<`void`\>

Defined in: [cap-transport-aws-sns-sqs/src/aws-topology.ts:75](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-aws-sns-sqs/src/aws-topology.ts#L75)

#### Parameters

##### snsClient

###### send

##### topicArn

`string`

##### queueArn

`string`

#### Returns

`Promise`\<`void`\>

***

### ensureTopic()

> **ensureTopic**(`snsClient`, `topicName`): `Promise`\<`string`\>

Defined in: [cap-transport-aws-sns-sqs/src/aws-topology.ts:25](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-aws-sns-sqs/src/aws-topology.ts#L25)

#### Parameters

##### snsClient

###### send

##### topicName

`string`

#### Returns

`Promise`\<`string`\>
