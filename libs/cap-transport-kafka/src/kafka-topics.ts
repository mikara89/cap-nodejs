import type { ResolvedKafkaOptions } from './kafka-options';
import type { KafkaClientFactory } from './kafka-types';

export class KafkaTopicManager {
  private readonly created = new Set<string>();

  constructor(
    private readonly client: KafkaClientFactory,
    private readonly options: ResolvedKafkaOptions,
  ) {}

  async ensure(topic: string): Promise<void> {
    if (!this.options.autoCreateTopics || this.created.has(topic)) return;
    const admin = this.client.admin();
    await admin.connect();
    try {
      await admin.createTopics({
        topics: [
          {
            topic,
            numPartitions: this.options.topicCreation.partitions,
            replicationFactor: this.options.topicCreation.replicationFactor,
            configEntries: Object.entries(
              this.options.topicCreation.config ?? {},
            ).map(([name, value]) => ({ name, value })),
          },
        ],
      });
      this.created.add(topic);
    } finally {
      await admin.disconnect();
    }
  }
}
