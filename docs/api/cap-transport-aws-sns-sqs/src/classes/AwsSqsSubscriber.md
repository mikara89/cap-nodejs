[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-transport-aws-sns-sqs/src](../README.md) / AwsSqsSubscriber

# Class: AwsSqsSubscriber

Defined in: [cap-transport-aws-sns-sqs/src/aws-sqs-subscriber.ts:24](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-aws-sns-sqs/src/aws-sqs-subscriber.ts#L24)

## Implements

- [`SubscriberPort`](../../../cap-nest/src/interfaces/SubscriberPort.md)

## Constructors

### Constructor

> **new AwsSqsSubscriber**(`options?`): `AwsSqsSubscriber`

Defined in: [cap-transport-aws-sns-sqs/src/aws-sqs-subscriber.ts:31](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-aws-sns-sqs/src/aws-sqs-subscriber.ts#L31)

#### Parameters

##### options?

[`AwsSnsSqsOptions`](../interfaces/AwsSnsSqsOptions.md) = `{}`

#### Returns

`AwsSqsSubscriber`

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [cap-transport-aws-sns-sqs/src/aws-sqs-subscriber.ts:240](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-aws-sns-sqs/src/aws-sqs-subscriber.ts#L240)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`SubscriberPort`](../../../cap-nest/src/interfaces/SubscriberPort.md).[`close`](../../../cap-nest/src/interfaces/SubscriberPort.md#close)

***

### consume()

> **consume**(`topic`, `group`, `handler`): `Promise`\<`void`\>

Defined in: [cap-transport-aws-sns-sqs/src/aws-sqs-subscriber.ts:45](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-aws-sns-sqs/src/aws-sqs-subscriber.ts#L45)

#### Parameters

##### topic

`string`

##### group

`string`

##### handler

[`CapHandler`](../../../cap-nest/src/type-aliases/CapHandler.md)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`SubscriberPort`](../../../cap-nest/src/interfaces/SubscriberPort.md).[`consume`](../../../cap-nest/src/interfaces/SubscriberPort.md#consume)

***

### initialize()

> **initialize**(`_options?`): `Promise`\<`void`\>

Defined in: [cap-transport-aws-sns-sqs/src/aws-sqs-subscriber.ts:41](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-aws-sns-sqs/src/aws-sqs-subscriber.ts#L41)

#### Parameters

##### \_options?

`InitOptions`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`SubscriberPort`](../../../cap-nest/src/interfaces/SubscriberPort.md).[`initialize`](../../../cap-nest/src/interfaces/SubscriberPort.md#initialize)
