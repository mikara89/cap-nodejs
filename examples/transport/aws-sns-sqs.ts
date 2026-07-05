import {
    AwsSnsPublisher,
    AwsSqsSubscriber,
    type AwsSnsSqsOptions,
} from '@mikara89/cap-transport-aws-sns-sqs';

const options: AwsSnsSqsOptions = {
    region: 'us-east-1',
    topicArn: process.env['AWS_SNS_TOPIC_ARN'] ?? 'arn:aws:sns:us-east-1:000000000000:cap-example',
    queueUrl: process.env['AWS_SQS_QUEUE_URL'] ?? 'https://sqs.us-east-1.amazonaws.com/000000000000/cap-example',
    autoProvision: false,
};

const publisher = new AwsSnsPublisher(options);
const subscriber = new AwsSqsSubscriber(options);

async function run(): Promise<void> {
    await publisher.initialize();
    await subscriber.consume('orders.created', 'billing', (payload, headers) => {
        console.log('received', payload, headers);
    });
    await publisher.emit(
        'orders.created',
        { id: 'order-1' },
        { 'correlation-id': 'request-1' },
        { messageId: 'outbox-1' },
    );
}

void run();

async function shutdown(): Promise<void> {
    await Promise.all([publisher.close(), subscriber.close()]);
}

process.once('SIGINT', () => void shutdown());
process.once('SIGTERM', () => void shutdown());
