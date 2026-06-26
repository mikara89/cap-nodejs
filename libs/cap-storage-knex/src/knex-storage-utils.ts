import type { Knex } from 'knex';
import type { JsonValue } from '@mikara89/cap-core';

export function getKnexClientName(knex: Knex): string {
  const clientConfig = (knex.client as { config?: { client?: unknown } })
    .config;
  const client = clientConfig?.client;
  return typeof client === 'string' ? client.toLowerCase() : '';
}

export function supportsSkipLockedClaiming(knex: Knex): boolean {
  const clientName = getKnexClientName(knex);
  return (
    clientName.includes('pg') ||
    clientName.includes('postgres') ||
    clientName.includes('mysql') ||
    clientName.includes('maria')
  );
}

export function serializeJson(value: unknown): string | null {
  return value === undefined ? null : JSON.stringify(value);
}

export function deserializeJson<T extends JsonValue = JsonValue>(
  value: unknown,
): T {
  if (value === null || value === undefined) return null as T;
  if (typeof value !== 'string') return value as T;
  return JSON.parse(value) as T;
}

export function toDbDate(
  value: Date | string | null | undefined,
): string | null {
  if (value === null || value === undefined) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export function toRequiredDbDate(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

export function fromDbDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value);
  }
  throw new Error(`Unsupported date value from Knex storage: ${typeof value}`);
}

export function isDuplicateKeyError(error: unknown): boolean {
  const candidate = error as {
    code?: string;
    errno?: number;
    constraint?: string;
    message?: string;
  };
  const message = candidate.message?.toLowerCase() ?? '';

  return (
    candidate.code === 'SQLITE_CONSTRAINT' ||
    candidate.code === '23505' ||
    candidate.code === 'ER_DUP_ENTRY' ||
    candidate.errno === 1062 ||
    message.includes('unique constraint') ||
    message.includes('duplicate entry')
  );
}
