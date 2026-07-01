import type { CapLogger } from '@mikara89/cap-core';
import type { ResolvedRabbitMqOptions } from './rabbitmq-options';

export async function retryConnection<T>(
  operation: () => Promise<T>,
  options: ResolvedRabbitMqOptions,
  label: string,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= options.reconnect.attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      options.logger?.warn?.(
        `${label} attempt ${attempt}/${options.reconnect.attempts} failed`,
        error,
      );
      if (attempt < options.reconnect.attempts) {
        await delay(backoff(attempt, options));
      }
    }
  }
  options.logger?.error?.(`${label} exhausted bounded retries`, lastError);
  throw lastError;
}

export function reportConnectionError(
  logger: CapLogger | undefined,
  owner: string,
  error: unknown,
): void {
  logger?.error?.(`${owner} RabbitMQ connection error`, error);
}

function backoff(attempt: number, options: ResolvedRabbitMqOptions): number {
  return Math.min(
    options.reconnect.maxDelayMs,
    options.reconnect.initialDelayMs * 2 ** (attempt - 1),
  );
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
