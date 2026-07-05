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
  readonly createdTopics = new Map<string, string>(); // topicName -> arn
  readonly createdQueues = new Map<string, string>(); // queueName -> url
  readonly subscriptions: Array<{
    topicArn: string;
    queueArn: string;
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
        if (this.failNextPublish) {
          const error = this.failNextPublish;
          this.failNextPublish = undefined;
          throw error;
        }
        if (this.pendingPublish) return this.pendingPublish;
        this.published.push({
          topicArn: command.input.TopicArn!,
          message: command.input.Message!,
          messageAttributes:
            (command.input.MessageAttributes as Record<
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
          QueueUrl?: string;
          MaxNumberOfMessages?: number;
          WaitTimeSeconds?: number;
          VisibilityTimeout?: number;
          ReceiptHandle?: string;
        };

        // DeleteMessage
        if ('ReceiptHandle' in input && input.ReceiptHandle) {
          const queue = this.queues.get(input.QueueUrl!);
          if (queue) {
            queue.deleteMessage(input.ReceiptHandle);
          }
          return undefined as never;
        }

        // ReceiveMessage
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
