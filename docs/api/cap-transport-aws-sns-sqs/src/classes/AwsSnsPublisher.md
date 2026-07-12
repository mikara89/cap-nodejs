[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-transport-aws-sns-sqs/src](../README.md) / AwsSnsPublisher

# Class: AwsSnsPublisher

Defined in: [cap-transport-aws-sns-sqs/src/aws-sns-publisher.ts:18](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-aws-sns-sqs/src/aws-sns-publisher.ts#L18)

## Implements

- [`PublisherPort`](../../../cap-nest/src/interfaces/PublisherPort.md)

## Constructors

### Constructor

> **new AwsSnsPublisher**(`options?`): `AwsSnsPublisher`

Defined in: [cap-transport-aws-sns-sqs/src/aws-sns-publisher.ts:24](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-aws-sns-sqs/src/aws-sns-publisher.ts#L24)

#### Parameters

##### options?

[`AwsSnsSqsOptions`](../interfaces/AwsSnsSqsOptions.md) = `{}`

#### Returns

`AwsSnsPublisher`

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [cap-transport-aws-sns-sqs/src/aws-sns-publisher.ts:81](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-aws-sns-sqs/src/aws-sns-publisher.ts#L81)

#### Returns

`Promise`\<`void`\>

***

### emit()

> **emit**(`topic`, `payload`, `headers?`, `metadata?`): `Promise`\<`void`\>

Defined in: [cap-transport-aws-sns-sqs/src/aws-sns-publisher.ts:50](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-aws-sns-sqs/src/aws-sns-publisher.ts#L50)

#### Parameters

##### topic

`string`

##### payload

`unknown`

##### headers?

[`CapHeaders`](../../../cap-nest/src/type-aliases/CapHeaders.md)

##### metadata?

[`PublishMetadata`](../../../cap-nest/src/interfaces/PublishMetadata.md)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`PublisherPort`](../../../cap-nest/src/interfaces/PublisherPort.md).[`emit`](../../../cap-nest/src/interfaces/PublisherPort.md#emit)

***

### initialize()

> **initialize**(`_options?`): `Promise`\<`void`\>

Defined in: [cap-transport-aws-sns-sqs/src/aws-sns-publisher.ts:33](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-aws-sns-sqs/src/aws-sns-publisher.ts#L33)

#### Parameters

##### \_options?

`InitOptions`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`PublisherPort`](../../../cap-nest/src/interfaces/PublisherPort.md).[`initialize`](../../../cap-nest/src/interfaces/PublisherPort.md#initialize)
