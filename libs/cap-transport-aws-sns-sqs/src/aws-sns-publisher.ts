import type {
  CapHeaders,
  InitOptions,
  PublisherPort,
  PublishMetadata,
} from '@mikara89/cap-core';
import { resolveAwsSnsSqsOptions } from './aws-config';
import {
  AwsSnsDisconnectedError,
  AwsSnsPublishTimeoutError,
} from './aws-errors';
import type { AwsSnsSqsOptions, ResolvedAwsSnsSqsOptions } from './aws-options';
import { AwsSnsSqsTopology } from './aws-topology';
import type { AwsClientFactory, SnsClient } from './aws-types';

const CONTENT_TYPE = 'content-type';
const MESSAGE_ID = 'cap-message-id';

export class AwsSnsPublisher implements PublisherPort {
  private readonly options: ResolvedAwsSnsSqsOptions;
  private readonly clients: AwsClientFactory;
  private readonly topology: AwsSnsSqsTopology;
  private sns?: SnsClient;
  private initializing?: Promise<void>;

  constructor(options: AwsSnsSqsOptions = {}) {
    this.options = resolveAwsSnsSqsOptions(options);
    this.clients = this.options.factory(
      this.options.region,
      this.options.credentials,
      this.options.endpoint,
    );
    this.topology = new AwsSnsSqsTopology(this.options.logger);
  }

  async initialize(_options?: InitOptions): Promise<void> {
    if (this.sns) return;
    if (this.initializing) return this.initializing;
    this.initializing = Promise.resolve()
      .then(() => {
        this.sns = this.clients.snsClient(
          this.options.region,
          this.options.credentials,
          this.options.endpoint,
        );
      })
      .finally(() => {
        this.initializing = undefined;
      });
    return this.initializing;
  }

  async emit(
    topic: string,
    payload: unknown,
    headers?: CapHeaders,
    metadata?: PublishMetadata,
  ): Promise<void> {
    const sns = this.sns;
    if (!sns) throw new AwsSnsDisconnectedError('publish');

    const topicArn = await this.resolveTopicArn(sns, topic);
    const encoded = JSON.stringify(payload);
    if (encoded === undefined)
      throw new TypeError('AWS SNS payload must be JSON-serializable');

    const messageAttributes = encodeMessageAttributes(
      headers,
      metadata?.messageId,
    );

    await withTimeout(
      sns.send({
        input: {
          TopicArn: topicArn,
          Message: encoded,
          MessageAttributes: messageAttributes,
        },
      }),
      this.options.publishTimeoutMs,
    );
  }

  close(): Promise<void> {
    const sns = this.sns;
    this.sns = undefined;
    if (sns) sns.destroy();
    return Promise.resolve();
  }

  private async resolveTopicArn(
    sns: SnsClient,
    topic: string,
  ): Promise<string> {
    if (this.options.topicArn) return this.options.topicArn;
    if (this.options.autoProvision) {
      return this.topology.ensureTopic(sns, this.options.topicName ?? topic);
    }
    throw new Error(
      'AWS SNS topicArn is required unless autoProvision is enabled',
    );
  }
}

function encodeMessageAttributes(
  headers?: CapHeaders,
  messageId?: string,
): Record<string, { DataType: string; StringValue: string }> {
  const attributes: Record<string, { DataType: string; StringValue: string }> =
    {
      [CONTENT_TYPE]: { DataType: 'String', StringValue: 'application/json' },
    };
  for (const [name, value] of Object.entries(headers ?? {})) {
    const stringValue =
      value instanceof Date ? value.toISOString() : String(value);
    // Detect numeric/boolean types for SNS attribute typing
    const dataType =
      typeof value === 'number'
        ? 'Number'
        : typeof value === 'boolean'
          ? 'String'
          : 'String';
    if (name !== CONTENT_TYPE) {
      attributes[name] = { DataType: dataType, StringValue: stringValue };
    }
  }
  if (messageId) {
    attributes[MESSAGE_ID] = { DataType: 'String', StringValue: messageId };
  }
  return attributes;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new AwsSnsPublishTimeoutError(timeoutMs)),
      timeoutMs,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}
