export class KafkaDisconnectedError extends Error {
  constructor(operation: string) {
    super(`Kafka transport is disconnected during ${operation}`);
    this.name = 'KafkaDisconnectedError';
  }
}

export class KafkaPublishTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Kafka publish acknowledgement timed out after ${timeoutMs}ms`);
    this.name = 'KafkaPublishTimeoutError';
  }
}

export class KafkaMalformedMessageError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'KafkaMalformedMessageError';
    if (cause !== undefined)
      (this as Error & { cause?: unknown }).cause = cause;
  }
}
