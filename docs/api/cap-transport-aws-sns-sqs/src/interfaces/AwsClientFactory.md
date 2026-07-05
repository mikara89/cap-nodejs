[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-transport-aws-sns-sqs/src](../README.md) / AwsClientFactory

# Interface: AwsClientFactory

Defined in: [cap-transport-aws-sns-sqs/src/aws-types.ts:18](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-aws-sns-sqs/src/aws-types.ts#L18)

## Methods

### snsClient()

> **snsClient**(`region`, `credentials?`): [`SnsClient`](SnsClient.md)

Defined in: [cap-transport-aws-sns-sqs/src/aws-types.ts:19](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-aws-sns-sqs/src/aws-types.ts#L19)

#### Parameters

##### region

`string`

##### credentials?

[`AwsCredentials`](AwsCredentials.md)

#### Returns

[`SnsClient`](SnsClient.md)

***

### sqsClient()

> **sqsClient**(`region`, `credentials?`): [`SqsClient`](SqsClient.md)

Defined in: [cap-transport-aws-sns-sqs/src/aws-types.ts:20](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-aws-sns-sqs/src/aws-types.ts#L20)

#### Parameters

##### region

`string`

##### credentials?

[`AwsCredentials`](AwsCredentials.md)

#### Returns

[`SqsClient`](SqsClient.md)
