[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-transport-aws-sns-sqs/src](../README.md) / AwsSnsSqsTopology

# Class: AwsSnsSqsTopology

Defined in: [cap-transport-aws-sns-sqs/src/aws-topology.ts:7](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-aws-sns-sqs/src/aws-topology.ts#L7)

Opt-in SNS/SQS topology provisioning. Resources are never deleted on close.

## Constructors

### Constructor

> **new AwsSnsSqsTopology**(`logger?`): `AwsSnsSqsTopology`

Defined in: [cap-transport-aws-sns-sqs/src/aws-topology.ts:12](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-aws-sns-sqs/src/aws-topology.ts#L12)

#### Parameters

##### logger?

[`CapLogger`](../../../cap-nest/src/interfaces/CapLogger.md)

#### Returns

`AwsSnsSqsTopology`

## Methods

### ensureQueue()

> **ensureQueue**(`sqsClient`, `queueName`): `Promise`\<`string`\>

Defined in: [cap-transport-aws-sns-sqs/src/aws-topology.ts:28](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-aws-sns-sqs/src/aws-topology.ts#L28)

#### Parameters

##### sqsClient

[`SqsClient`](../interfaces/SqsClient.md)

##### queueName

`string`

#### Returns

`Promise`\<`string`\>

***

### ensureSubscription()

> **ensureSubscription**(`snsClient`, `sqsClient`, `topicArn`, `queueUrl`): `Promise`\<`void`\>

Defined in: [cap-transport-aws-sns-sqs/src/aws-topology.ts:42](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-aws-sns-sqs/src/aws-topology.ts#L42)

#### Parameters

##### snsClient

[`SnsClient`](../interfaces/SnsClient.md)

##### sqsClient

[`SqsClient`](../interfaces/SqsClient.md)

##### topicArn

`string`

##### queueUrl

`string`

#### Returns

`Promise`\<`void`\>

***

### ensureTopic()

> **ensureTopic**(`snsClient`, `topicName`): `Promise`\<`string`\>

Defined in: [cap-transport-aws-sns-sqs/src/aws-topology.ts:14](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-aws-sns-sqs/src/aws-topology.ts#L14)

#### Parameters

##### snsClient

[`SnsClient`](../interfaces/SnsClient.md)

##### topicName

`string`

#### Returns

`Promise`\<`string`\>
