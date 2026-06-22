import { type CapHeaders } from '../models/cap-headers.type';
import { type JsonValue } from '../models/json-value.type';
import {
  type PublishMetadata,
  type PublisherPort,
} from '../ports/publisher.port';

export class FakePublisher implements PublisherPort {
  readonly emitted: Array<{
    topic: string;
    payload: unknown;
    headers?: CapHeaders;
    metadata?: PublishMetadata;
  }> = [];
  error?: Error;

  emit<T extends JsonValue = JsonValue>(
    topic: string,
    payload: T,
    headers?: CapHeaders,
    metadata?: PublishMetadata,
  ): Promise<void> {
    if (this.error) return Promise.reject(this.error);
    this.emitted.push({ topic, payload, headers, metadata });
    return Promise.resolve();
  }
}

export function createInMemoryPublisher(): FakePublisher {
  return new FakePublisher();
}
