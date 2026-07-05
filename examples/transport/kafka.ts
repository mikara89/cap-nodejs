import {
  KafkaPublisher,
  KafkaSubscriber,
  type KafkaOptions,
} from '@mikara89/cap-transport-kafka';

const options: KafkaOptions = {
  clientId: 'cap-example',
  brokers: ['localhost:9092'],
  topicPrefix: 'example.',
  autoCreateTopics: false,
  producer: { acks: -1 },
};

const publisher = new KafkaPublisher(options);
const subscriber = new KafkaSubscriber(options);

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
