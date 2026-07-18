import type {
  CapHandler,
  CapHeaders,
  InitOptions,
  SubscriberPort,
  SubscribeMetadata,
} from '@mikara89/cap-core';
import { resolveAwsSnsSqsOptions } from './aws-config';
import { AwsSqsMalformedMessageError } from './aws-errors';
import type { AwsSnsSqsOptions, ResolvedAwsSnsSqsOptions } from './aws-options';
import { AwsSnsSqsTopology } from './aws-topology';
import type { AwsClientFactory, SqsClient } from './aws-types';

const CONTENT_TYPE = 'content-type';
const MESSAGE_ID = 'cap-message-id';

interface QueueState {
  client: SqsClient;
  handlers: Map<string, CapHandler>;
  pollers: Map<string, Promise<void>>;
  stopped: boolean;
}

export class AwsSqsSubscriber implements SubscriberPort {
  private readonly options: ResolvedAwsSnsSqsOptions;
  private readonly clients: AwsClientFactory;
  private readonly topology: AwsSnsSqsTopology;
  private readonly queues = new Map<string, QueueState>();
  private queueSetup?: Promise<{ queueUrl: string; state: QueueState }>;
  private closePromise?: Promise<void>;
  private stopping = false;

  constructor(options: AwsSnsSqsOptions = {}) {
    this.options = resolveAwsSnsSqsOptions(options);
    this.clients = this.options.factory(
      this.options.region,
      this.options.credentials,
      this.options.endpoint,
    );
    this.topology = new AwsSnsSqsTopology(this.options.logger);
  }

  initialize(_options?: InitOptions): Promise<void> {
    return Promise.resolve();
  }

  async consume(
    topic: string,
    group: string,
    handler: CapHandler,
  ): Promise<void> {
    if (this.stopping) {
      throw new Error('AwsSqsSubscriber is closing or closed');
    }
    const { queueUrl, state } = await this.setupQueue(topic);
    if (this.stopping) {
      throw new Error('AwsSqsSubscriber is closing or closed');
    }
    const handlerKey = `${topic}/${group}`;
    if (state.handlers.has(handlerKey)) return;
    if (state.handlers.size > 0) {
      throw new Error(
        'One AwsSqsSubscriber instance supports one CAP subscription; use a separate configured queue for another topic or group',
      );
    }
    state.handlers.set(handlerKey, handler);

    for (let index = 0; index < this.options.concurrency; index += 1) {
      const pollerKey = `${handlerKey}/${index}`;
      const poller = this.startPolling(
        queueUrl,
        state,
        topic,
        group,
        handlerKey,
      ).catch((error) => {
        this.options.logger?.error?.(
          `AWS SQS polling loop failed for ${queueUrl}`,
          error,
        );
      });
      state.pollers.set(pollerKey, poller);
      void poller.then(() => {
        if (state.pollers.get(pollerKey) === poller) {
          state.pollers.delete(pollerKey);
        }
      });
    }
  }

  private async setupQueue(
    topic: string,
  ): Promise<{ queueUrl: string; state: QueueState }> {
    if (this.queueSetup) return this.queueSetup;
    const client = this.clients.sqsClient(
      this.options.region,
      this.options.credentials,
      this.options.endpoint,
    );
    this.queueSetup = (async () => {
      const queueUrl = this.options.queueUrl
        ? this.options.queueUrl
        : await this.provisionQueue(client, topic);
      const state: QueueState = {
        client,
        handlers: new Map(),
        pollers: new Map(),
        stopped: false,
      };
      this.queues.set(queueUrl, state);
      return { queueUrl, state };
    })().catch((error) => {
      client.destroy();
      this.queueSetup = undefined;
      throw error;
    });
    return this.queueSetup;
  }

  private async provisionQueue(
    sqsClient: SqsClient,
    topic: string,
  ): Promise<string> {
    if (!this.options.autoProvision || !this.options.queueName) {
      throw new Error(
        'AWS SQS queueUrl is required unless autoProvision and queueName are configured',
      );
    }
    const queueUrl = await this.topology.ensureQueue(
      sqsClient,
      this.options.queueName,
    );
    const snsClient = this.clients.snsClient(
      this.options.region,
      this.options.credentials,
      this.options.endpoint,
    );
    try {
      const topicArn = this.options.topicArn
        ? this.options.topicArn
        : await this.topology.ensureTopic(
            snsClient,
            this.options.topicName ?? topic,
          );
      await this.topology.ensureSubscription(
        snsClient,
        sqsClient,
        topicArn,
        queueUrl,
      );
      return queueUrl;
    } finally {
      snsClient.destroy();
    }
  }

  private async startPolling(
    queueUrl: string,
    state: QueueState,
    topic: string,
    group: string,
    handlerKey: string,
  ): Promise<void> {
    while (!state.stopped) {
      try {
        const response = (await state.client.send({
          input: {
            QueueUrl: queueUrl,
            MaxNumberOfMessages: this.options.maxNumberOfMessages,
            WaitTimeSeconds: this.options.waitTimeSeconds,
            VisibilityTimeout: this.options.visibilityTimeout,
          },
        })) as {
          Messages?: Array<{
            MessageId?: string;
            ReceiptHandle?: string;
            Body?: string;
            MessageAttributes?: Record<
              string,
              { DataType?: string; StringValue?: string }
            >;
          }>;
        };

        const messages = response.Messages ?? [];
        for (const message of messages) {
          if (state.stopped) return;
          if (!message.ReceiptHandle) continue;

          const handler = state.handlers.get(handlerKey);
          if (!handler) continue;

          try {
            const decoded = decodeMessage(
              message.Body ?? '',
              message.MessageAttributes,
            );
            await handler(
              decoded.payload,
              decoded.headers,
              resolveSubscribeMetadata(
                topic,
                group,
                decoded.messageId ?? message.MessageId ?? 'unknown',
              ),
            );
          } catch (error) {
            if (error instanceof AwsSqsMalformedMessageError) {
              // Malformed message — delete it to avoid poison-message loop
              this.options.logger?.error?.(
                `Deleting malformed SQS message ${message.MessageId} from ${queueUrl}`,
                error,
              );
              await state.client.send({
                input: {
                  QueueUrl: queueUrl,
                  ReceiptHandle: message.ReceiptHandle,
                },
              });
              continue;
            }
            // Handler failure — do not delete; message will become visible again
            throw error;
          }

          // Handler success — delete the message
          await state.client.send({
            input: {
              QueueUrl: queueUrl,
              ReceiptHandle: message.ReceiptHandle,
            },
          });
        }

        // Yield to the event loop between polls to avoid starving
        // close() calls and other macrotasks when using synchronous fakes
        if (messages.length === 0) {
          await delay(100);
        }
      } catch (error) {
        if (state.stopped) return;
        this.options.logger?.warn?.(
          `AWS SQS receive error for ${queueUrl}, retrying`,
          error,
        );
        await delay(1_000);
      }
    }
  }

  close(): Promise<void> {
    if (this.closePromise) return this.closePromise;
    this.stopping = true;
    this.closePromise = this.drainAndClose();
    return this.closePromise;
  }

  private async drainAndClose(): Promise<void> {
    if (this.queueSetup) {
      try {
        await this.queueSetup;
      } catch {
        // setupQueue destroys its client when provisioning fails
      }
    }

    const states = [...this.queues.values()];
    for (const state of states) {
      state.stopped = true;
    }
    await Promise.allSettled(
      states.flatMap((state) => [...state.pollers.values()]),
    );
    for (const state of states) {
      state.pollers.clear();
      state.handlers.clear();
      state.client.destroy();
    }
    this.queues.clear();
    this.queueSetup = undefined;
  }
}

function resolveSubscribeMetadata(
  topic: string,
  group: string,
  messageId: string,
): SubscribeMetadata {
  return {
    messageId,
    dedupeKey: `${topic}/${group}|${messageId}`,
  };
}

function decodeMessage(
  body: string,
  rawAttributes?: Record<string, { DataType?: string; StringValue?: string }>,
): { payload: unknown; headers?: CapHeaders; messageId?: string } {
  // SNS → SQS subscriptions wrap the published message inside an SNS
  // notification JSON envelope.  Detect and unwrap it so downstream
  // consumers receive the original payload and attributes.
  const { innerBody, attributes } = unwrapSnsNotification(body, rawAttributes);

  const contentType =
    attributes?.[CONTENT_TYPE]?.StringValue ?? 'application/json';
  if (contentType !== 'application/json') {
    throw new AwsSqsMalformedMessageError(
      'AWS SQS message content-type must be application/json',
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(innerBody) as unknown;
  } catch (error) {
    throw new AwsSqsMalformedMessageError(
      'AWS SQS message contains invalid JSON',
      error,
    );
  }

  const headers: CapHeaders = {};
  let messageId: string | undefined;
  for (const [name, attr] of Object.entries(attributes ?? {})) {
    if (name === CONTENT_TYPE) continue;
    if (name === MESSAGE_ID) {
      messageId = attr.StringValue;
      continue;
    }
    if (attr.StringValue === undefined) continue;
    headers[name] = decodeAttributeValue(
      attr.DataType ?? 'String',
      attr.StringValue,
    );
  }

  return {
    payload,
    headers: Object.keys(headers).length ? headers : undefined,
    messageId,
  };
}

interface SnsAttribute {
  Type: string;
  Value: string;
}

interface SqsAttribute {
  DataType?: string;
  StringValue?: string;
}

function unwrapSnsNotification(
  body: string,
  rawAttributes?: Record<string, SqsAttribute>,
): {
  innerBody: string;
  attributes?: Record<string, SqsAttribute>;
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body) as unknown;
  } catch {
    return { innerBody: body, attributes: rawAttributes };
  }

  if (
    parsed === null ||
    typeof parsed !== 'object' ||
    !('Type' in parsed) ||
    (parsed as Record<string, unknown>).Type !== 'Notification' ||
    typeof (parsed as Record<string, unknown>).Message !== 'string'
  ) {
    return { innerBody: body, attributes: rawAttributes };
  }

  const notification = parsed as {
    Type: string;
    Message: string;
    MessageAttributes?: Record<string, SnsAttribute>;
  };

  // Convert SNS MessageAttributes (Type/Value) to the SQS attribute
  // shape (DataType/StringValue) expected by the rest of the pipeline.
  const snsAttrs = notification.MessageAttributes;
  const converted: Record<string, SqsAttribute> = {};
  if (snsAttrs) {
    for (const [key, attr] of Object.entries(snsAttrs)) {
      converted[key] = {
        DataType: attr.Type,
        StringValue: attr.Value,
      };
    }
  }

  return {
    innerBody: notification.Message,
    attributes: Object.keys(converted).length ? converted : rawAttributes,
  };
}

function decodeAttributeValue(
  dataType: string,
  value: string,
): string | number | boolean {
  if (dataType === 'Number') {
    const num = Number(value);
    return Number.isNaN(num) ? value : num;
  }
  if (dataType === 'String') {
    // Try to parse JSON for backward compatibility
    try {
      const decoded: unknown = JSON.parse(value);
      return typeof decoded === 'string' ||
        typeof decoded === 'number' ||
        typeof decoded === 'boolean'
        ? decoded
        : value;
    } catch {
      return value;
    }
  }
  return value;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
