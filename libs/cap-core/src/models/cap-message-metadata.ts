import type { PublishMetadata } from '../ports/publisher.port';
import type { SubscribeMetadata } from '../ports/subscriber.port';

export interface CapMessageMetadata {
  messageId?: string;
  dedupeKey?: string;
}

export type CapPublishMetadata = PublishMetadata;
export type CapSubscribeMetadata = SubscribeMetadata;
