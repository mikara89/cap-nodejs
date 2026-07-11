[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-transport-aws-sns-sqs/src](../README.md) / AwsClientFactory

# Interface: AwsClientFactory

Defined in: cap-transport-aws-sns-sqs/src/aws-types.ts:18

## Methods

### snsClient()

> **snsClient**(`region`, `credentials?`, `endpoint?`): [`SnsClient`](SnsClient.md)

Defined in: cap-transport-aws-sns-sqs/src/aws-types.ts:19

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

Defined in: cap-transport-aws-sns-sqs/src/aws-types.ts:24

#### Parameters

##### region

`string`

##### credentials?

[`AwsCredentials`](AwsCredentials.md)

##### endpoint?

`string`

#### Returns

[`SqsClient`](SqsClient.md)
