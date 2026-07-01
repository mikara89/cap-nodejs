import {
  RabbitMqPublisher,
  RabbitMqSubscriber,
} from '@mikara89/cap-transport-rabbitmq';

const rabbitMqOptions = {
  url: process.env.RABBITMQ_URL ?? 'amqp://localhost',
  exchangeName: 'cap.events',
  queuePrefix: 'cap.',
  prefetch: 16,
};

export const rabbitMqPublisher = new RabbitMqPublisher(rabbitMqOptions);
export const rabbitMqSubscriber = new RabbitMqSubscriber(rabbitMqOptions);

export async function startRabbitMqExample(): Promise<void> {
  await rabbitMqPublisher.initialize();
  await rabbitMqSubscriber.consume(
    'orders.*',
    'billing',
    (payload, headers, metadata) => {
      console.log('RabbitMQ CAP delivery', { payload, headers, metadata });
    },
  );
}

export async function stopRabbitMqExample(): Promise<void> {
  await rabbitMqSubscriber.close();
  await rabbitMqPublisher.close();
}
