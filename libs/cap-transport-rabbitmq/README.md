# @mikara89/cap-transport-rabbitmq

Framework-neutral RabbitMQ transport adapter for CAP, built on `amqplib`.

## Installation and compatibility

```sh
npm install @mikara89/cap-transport-rabbitmq @mikara89/cap-core
```

Node.js 22 or newer is required. The supported core range starts at
`@mikara89/cap-core@2.2.0`. `amqplib` and its declarations are runtime
dependencies of this package; consumers do not need a monorepo checkout.

## Guarantees

- Publishes persistent JSON messages to a durable topic exchange.
- Resolves `emit()` only after a RabbitMQ publisher confirmation and, when the
  channel applies backpressure, after `drain`.
- Rejects broker nacks, channel errors, serialization failures, and confirmation
  timeouts. A disconnected publisher fails fast; it never silently buffers a
  publish during recovery.
- A confirmation proves broker acceptance, not routing or consumer processing.
  Publishing with no bound queue still confirms and the message is discarded by
  RabbitMQ. Mandatory publishing is intentionally disabled because the adapter
  does not implement returned-message correlation.
- Uses durable group queues, topic bindings, configurable prefetch, and manual
  acknowledgements. The delivery is acknowledged only after the CAP inbound
  handler resolves.

CAP owns durable inbox retries. A resolved CAP inbound handler means its inbox
outcome—including a persisted application-handler failure—has been recorded, so
the broker delivery is acknowledged. If the CAP boundary itself rejects, the
adapter nacks without requeue by default to avoid a competing broker retry loop.
Set `requeueOnHandlerError: true` only when the application deliberately owns
that broker-redelivery policy. Invalid JSON and non-JSON messages are always
rejected without requeue and may dead-letter when a DLX is configured.

## Usage

```ts
import {
  RabbitMqPublisher,
  RabbitMqSubscriber,
} from '@mikara89/cap-transport-rabbitmq';

const options = {
  url: process.env.RABBITMQ_URL!,
  exchangeName: 'cap.events',
  queuePrefix: 'cap.',
  prefetch: 16,
};

const publisher = new RabbitMqPublisher(options);
const subscriber = new RabbitMqSubscriber(options);

await publisher.initialize();
await subscriber.consume(
  'orders.*',
  'billing',
  async (payload, headers, metadata) => {
    // Register these instances as CAP's PublisherPort and SubscriberPort.
  },
);

await publisher.emit('orders.created', { id: 'order-1' }, undefined, {
  messageId: 'outbox-1',
});

// During graceful shutdown:
await subscriber.close();
await publisher.close();
```

## Topology and recovery

Defaults are a durable `cap` topic exchange, durable classic queues named
`cap.<group>`, prefetch `1`, and automatic topology creation. `namingPrefix`
prefixes both the exchange and generated queues. Quorum queues are used only
with `queueType: 'quorum'`. Dead-letter arguments are applied only when
`deadLetterExchange` (and optionally `deadLetterRoutingKey`) is configured.
Set `autoCreateTopology: false` when operators provision matching resources.

The adapter accepts a connection `url` or an injected `connectionFactory`.
Initialization and recovery use bounded exponential backoff (five attempts by
default) and report each failure through the optional CAP logger. Subscribers
restore prefetch, topology, bindings, and consumers after reconnect. Publishers
restore their confirm channel and exchange. Publishes fail fast while recovery
is in progress; initialization and subscriber registration wait for the bounded
connection attempt. `close()` cancels consumers and closes channels and
connections idempotently.

## Options

- `exchangeName`, `exchangeType: 'topic'`, `exchangeDurable`
- `namingPrefix`, `queuePrefix`, `queueType: 'classic' | 'quorum'`
- `prefetch`, `autoCreateTopology`
- `deadLetterExchange`, `deadLetterRoutingKey`
- `confirmTimeoutMs`, `reconnect`
- `requeueOnHandlerError`
- `url`, `socketOptions`, `connectionFactory`, `logger`

Generated names and numeric settings are validated. Quorum queues and
dead-lettering are not CAP-wide capabilities and are not advertised unless the
corresponding RabbitMQ options are explicitly configured.

## Integration verification

The real-broker suite uses the repository-pinned `rabbitmq:4.1.0-alpine`
image:

```sh
npm run test:integration:rabbitmq
```
