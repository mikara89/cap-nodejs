export class AwsSnsDisconnectedError extends Error {
  constructor(operation: string) {
    super(`AWS SNS transport is disconnected during ${operation}`);
    this.name = 'AwsSnsDisconnectedError';
  }
}

export class AwsSnsPublishTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`AWS SNS publish timed out after ${timeoutMs}ms`);
    this.name = 'AwsSnsPublishTimeoutError';
  }
}

export class AwsSqsMalformedMessageError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'AwsSqsMalformedMessageError';
    if (cause !== undefined)
      (this as Error & { cause?: unknown }).cause = cause;
  }
}
