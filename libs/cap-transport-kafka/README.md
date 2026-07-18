# @mikara89/cap-transport-kafka

Framework-neutral Kafka transport adapter for CAP Node.js.

## Installation and compatibility

```sh
npm install @mikara89/cap-transport-kafka @mikara89/cap-core
```

Node.js 22 or newer is required. The supported core range starts at
`@mikara89/cap-core@2.2.0`. The package installs the native
`@confluentinc/kafka-javascript` runtime dependency and verifies that native
installation in an isolated consumer smoke test.

## Client choice

The adapter uses `@confluentinc/kafka-javascript`. The dependency spike compared
it with KafkaJS and node-rdkafka. Confluent's client is actively maintained,
supports current Node releases with prebuilt binaries, is backed by current
librdkafka, and offers a typed KafkaJS-compatible promise API. KafkaJS has the
simplest pure-JavaScript installation but its latest stable release is several
years old. node-rdkafka has an older callback-heavy API and more fragile native
build ergonomics. The repository's install, build, and pack smoke gates verify
the native dependency on supported CI platforms.

## Usage

```ts
import { KafkaPublisher, KafkaSubscriber } from '@mikara89/cap-transport-kafka';

const options = {
  clientId: 'orders-service',
  brokers: ['localhost:9092'],
  topicPrefix: 'myapp.',
  ssl: false,
};

const publisher = new KafkaPublisher(options);
const subscriber = new KafkaSubscriber(options);

await publisher.initialize();
await subscriber.consume('orders.created', 'billing', async (payload) => {
  console.log(payload);
});
await publisher.emit('orders.created', { id: 'order-1' }, undefined, {
  messageId: 'outbox-1',
});

// During graceful shutdown:
await subscriber.close();
await publisher.close();
```

`ssl`, `sasl`, producer options, and consumer options are configurable. Producer
acks default to `-1` (all in-sync replicas), and `emit` resolves only after the
client delivery promise resolves. Serialization, broker, disconnect, and
adapter timeout failures reject.

Topic creation is disabled by default, so normal runtime needs no Kafka admin
permission. Set `autoCreateTopics: true` to opt in and configure partitions,
replication factor, and topic config through `topicCreation`.

Consumers use Kafka consumer groups and disable auto-commit. The adapter commits
`offset + 1` only after the CAP callback succeeds. Handler failures remain
visible and are not committed; new groups read from the beginning by default,
while existing groups resume their committed offsets. Delivery remains at least
once, so handlers must be idempotent. CAP inbox retry remains authoritative.
Messages with missing/wrong content type, empty values, or invalid JSON are
logged, skipped, and committed once so poison messages cannot loop forever.

Call `close()` during graceful shutdown. One Kafka consumer is owned per CAP
group and all producer/consumer resources are stopped and disconnected.

The adapter does not claim exactly-once processing or cross-system atomicity.
Applications own idempotency through CAP inbox semantics. Run the pinned
`apache/kafka:3.9.1` real-broker integration with:

```sh
npm run test:integration:kafka
```
