import type {
  AwsClientFactory,
  AwsCredentials,
  AwsFactory,
  SnsClient,
  SqsClient,
} from '../src';

export interface FakePublishedMessage {
  topicArn: string;
  message: string;
  messageAttributes: Record<string, { DataType: string; StringValue: string }>;
}

export class FakeAwsBroker implements AwsClientFactory {
  readonly published: FakePublishedMessage[] = [];
  readonly queues = new Map<string, FakeSqsQueue>();
  readonly queueAttributes = new Map<string, Record<string, string>>();
  readonly createdTopics = new Map<string, string>(); // topicName -> arn
  readonly createdQueues = new Map<string, string>(); // queueName -> url
  readonly subscriptions: Array<{
    topicArn: string;
    queueArn: string;
  }> = [];
  readonly receiveRequests: Array<{
    queueUrl: string;
    maxNumberOfMessages: number;
    waitTimeSeconds: number;
    visibilityTimeout: number;
  }> = [];
  snsClientCount = 0;
  sqsClientCount = 0;
  failNextPublish?: Error;
  pendingPublish?: Promise<never>;
  region?: string;

  readonly factory: AwsFactory = (region, _credentials, _endpoint) => {
    this.region = region;
    return this;
  };

  snsClient(
    _region: string,
    _credentials?: AwsCredentials,
    _endpoint?: string,
  ): SnsClient {
    this.snsClientCount += 1;
    let destroyed = false;
    return {
      send: async (command) => {
        if (destroyed) throw new Error('SNS client destroyed');
        const input = command.input;
        if (typeof input.Name === 'string') {
          const arn = `arn:aws:sns:${this.region}:000000000000:${input.Name}`;
          this.createdTopics.set(input.Name, arn);
          return { TopicArn: arn };
        }
        if (
          input.Protocol === 'sqs' &&
          typeof input.TopicArn === 'string' &&
          typeof input.Endpoint === 'string'
        ) {
          this.subscriptions.push({
            topicArn: input.TopicArn,
            queueArn: input.Endpoint,
          });
          return {
            SubscriptionArn: `subscription-${this.subscriptions.length}`,
          };
        }
        if (this.failNextPublish) {
          const error = this.failNextPublish;
          this.failNextPublish = undefined;
          throw error;
        }
        if (this.pendingPublish) return this.pendingPublish;
        this.published.push({
          topicArn: String(input.TopicArn),
          message: String(input.Message),
          messageAttributes:
            (input.MessageAttributes as Record<
              string,
              { DataType: string; StringValue: string }
            >) ?? {},
        });
        return { MessageId: `fake-message-${this.published.length}` };
      },
      destroy: () => {
        destroyed = true;
        this.snsClientCount -= 1;
      },
    };
  }

  sqsClient(
    _region: string,
    _credentials?: AwsCredentials,
    _endpoint?: string,
  ): SqsClient {
    this.sqsClientCount += 1;
    let destroyed = false;
    const client: SqsClient = {
      send: (command) => {
        if (destroyed) throw new Error('SQS client destroyed');
        const input = command.input as {
          QueueName?: string;
          QueueUrl?: string;
          AttributeNames?: string[];
          Attributes?: Record<string, string>;
          MaxNumberOfMessages?: number;
          WaitTimeSeconds?: number;
          VisibilityTimeout?: number;
          ReceiptHandle?: string;
        };

        if (input.QueueName) {
          const queueUrl = `https://sqs.${this.region}.amazonaws.com/000000000000/${input.QueueName}`;
          this.createdQueues.set(input.QueueName, queueUrl);
          this.getOrCreateQueue(queueUrl);
          this.getOrCreateQueueAttributes(queueUrl);
          return { QueueUrl: queueUrl } as never;
        }

        if (input.AttributeNames) {
          const attributes = this.getOrCreateQueueAttributes(input.QueueUrl!);
          return {
            Attributes: Object.fromEntries(
              input.AttributeNames.flatMap((name) =>
                attributes[name] === undefined
                  ? []
                  : [[name, attributes[name]]],
              ),
            ),
          } as never;
        }

        if (input.Attributes) {
          const attributes = this.getOrCreateQueueAttributes(input.QueueUrl!);
          Object.assign(attributes, input.Attributes);
          return {} as never;
        }

        // DeleteMessage
        if ('ReceiptHandle' in input && input.ReceiptHandle) {
          const queue = this.queues.get(input.QueueUrl!);
          if (queue) {
            queue.deleteMessage(input.ReceiptHandle);
          }
          return undefined as never;
        }

        // ReceiveMessage
        this.receiveRequests.push({
          queueUrl: input.QueueUrl!,
          maxNumberOfMessages: input.MaxNumberOfMessages ?? 10,
          waitTimeSeconds: input.WaitTimeSeconds ?? 20,
          visibilityTimeout: input.VisibilityTimeout ?? 30,
        });
        const queue = this.getOrCreateQueue(input.QueueUrl!);
        const messages = queue.receiveMessages(input.MaxNumberOfMessages ?? 10);
        return { Messages: messages } as never;
      },
      destroy: () => {
        destroyed = true;
        this.sqsClientCount -= 1;
      },
    };
    return client;
  }

  getOrCreateQueue(queueUrl: string): FakeSqsQueue {
    if (!this.queues.has(queueUrl)) {
      this.queues.set(queueUrl, new FakeSqsQueue(queueUrl));
    }
    return this.queues.get(queueUrl)!;
  }

  getOrCreateQueueAttributes(queueUrl: string): Record<string, string> {
    let attributes = this.queueAttributes.get(queueUrl);
    if (!attributes) {
      const queueName = queueUrl.split('/').at(-1) ?? 'unknown';
      attributes = {
        QueueArn: `arn:aws:sqs:${this.region ?? 'us-east-1'}:000000000000:${queueName}`,
      };
      this.queueAttributes.set(queueUrl, attributes);
    }
    return attributes;
  }

  setQueuePolicy(queueUrl: string, policy: string): void {
    this.getOrCreateQueueAttributes(queueUrl).Policy = policy;
  }

  queuePolicy(queueUrl: string): string | undefined {
    return this.getOrCreateQueueAttributes(queueUrl).Policy;
  }

  deliver(
    queueUrl: string,
    body: string,
    messageAttributes: Record<
      string,
      { DataType: string; StringValue: string }
    >,
  ): string {
    const queue = this.getOrCreateQueue(queueUrl);
    return queue.addMessage(body, messageAttributes);
  }

  activeSnsClients(): number {
    return this.snsClientCount;
  }

  activeSqsClients(): number {
    return this.sqsClientCount;
  }

  hasQueueActivity(queueUrl: string): boolean {
    const queue = this.queues.get(queueUrl);
    return queue ? queue.messages.size > 0 : false;
  }
}

export class FakeSqsQueue {
  readonly messages = new Map<
    string,
    {
      body: string;
      messageAttributes: Record<
        string,
        { DataType: string; StringValue: string }
      >;
      visible: boolean;
      receiveCount: number;
    }
  >();
  readonly deleted = new Set<string>();
  private messageCounter = 0;

  constructor(readonly queueUrl: string) {}

  addMessage(
    body: string,
    messageAttributes: Record<
      string,
      { DataType: string; StringValue: string }
    >,
  ): string {
    const id = `fake-msg-${++this.messageCounter}`;
    this.messages.set(id, {
      body,
      messageAttributes,
      visible: true,
      receiveCount: 0,
    });
    return id;
  }

  receiveMessages(max: number): Array<{
    MessageId: string;
    ReceiptHandle: string;
    Body: string;
    MessageAttributes: Record<
      string,
      { DataType: string; StringValue: string }
    >;
  }> {
    const result: Array<{
      MessageId: string;
      ReceiptHandle: string;
      Body: string;
      MessageAttributes: Record<
        string,
        { DataType: string; StringValue: string }
      >;
    }> = [];
    for (const [id, msg] of this.messages) {
      if (result.length >= max) break;
      if (msg.visible && !this.deleted.has(id)) {
        msg.visible = false;
        msg.receiveCount += 1;
        result.push({
          MessageId: id,
          ReceiptHandle: `receipt-${id}`,
          Body: msg.body,
          MessageAttributes: msg.messageAttributes,
        });
      }
    }
    return result;
  }

  deleteMessage(receiptHandle: string): void {
    this.deleted.add(receiptHandle);
  }

  makeVisible(receiptHandle: string): void {
    const id = receiptHandle.replace('receipt-', '');
    const msg = this.messages.get(id);
    if (msg) msg.visible = true;
  }

  visibleCount(): number {
    let count = 0;
    for (const [id, msg] of this.messages) {
      if (msg.visible && !this.deleted.has(id)) count++;
    }
    return count;
  }
}
