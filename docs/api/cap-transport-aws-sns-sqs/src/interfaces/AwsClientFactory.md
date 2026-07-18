[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-transport-aws-sns-sqs/src](../README.md) / AwsClientFactory

# Interface: AwsClientFactory

Defined in: [cap-transport-aws-sns-sqs/src/aws-types.ts:11](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-aws-sns-sqs/src/aws-types.ts#L11)

## Methods

### snsClient()

> **snsClient**(`region`, `credentials?`, `endpoint?`): [`SnsClient`](SnsClient.md)

Defined in: [cap-transport-aws-sns-sqs/src/aws-types.ts:12](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-aws-sns-sqs/src/aws-types.ts#L12)

#### Parameters

##### region

`string`

##### credentials?

[`AwsCredentials`](AwsCredentials.md)

##### endpoint?

`string`

#### Returns

[`SnsClient`](SnsClient.md)

***

### sqsClient()

> **sqsClient**(`region`, `credentials?`, `endpoint?`): [`SqsClient`](SqsClient.md)

Defined in: [cap-transport-aws-sns-sqs/src/aws-types.ts:17](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-aws-sns-sqs/src/aws-types.ts#L17)

#### Parameters

##### region

`string`

##### credentials?

[`AwsCredentials`](AwsCredentials.md)

##### endpoint?

`string`

#### Returns

[`SqsClient`](SqsClient.md)
