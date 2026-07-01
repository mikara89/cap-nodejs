export class RabbitMqDisconnectedError extends Error {
  constructor(operation: string) {
    super(`RabbitMQ is disconnected; ${operation} failed fast`);
    this.name = 'RabbitMqDisconnectedError';
  }
}

export class RabbitMqConfirmTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`RabbitMQ publisher confirmation timed out after ${timeoutMs}ms`);
    this.name = 'RabbitMqConfirmTimeoutError';
  }
}

export class RabbitMqMalformedMessageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RabbitMqMalformedMessageError';
  }
}
