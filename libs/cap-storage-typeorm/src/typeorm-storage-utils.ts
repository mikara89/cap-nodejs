import type { DataSource } from 'typeorm';
import type { JsonValue } from '@mikara89/cap-core';

export function getTypeOrmDialect(dataSource: DataSource): string {
  return String(dataSource.options.type).toLowerCase();
}

export function supportsTypeOrmSkipLockedClaiming(
  dataSource: DataSource,
): boolean {
  const dialect = getTypeOrmDialect(dataSource);
  return (
    dialect === 'postgres' ||
    dialect === 'cockroachdb' ||
    dialect === 'mysql' ||
    dialect === 'mariadb'
  );
}

export function escapeIdentifier(
  dataSource: DataSource,
  identifier: string,
): string {
  return dataSource.driver.escape(identifier);
}

export function column(
  dataSource: DataSource,
  alias: string,
  name: string,
): string {
  return `${escapeIdentifier(dataSource, alias)}.${escapeIdentifier(
    dataSource,
    name,
  )}`;
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
  throw new Error(
    `Unsupported date value from TypeORM storage: ${typeof value}`,
  );
}

export function isDuplicateKeyError(error: unknown): boolean {
  const candidate = error as {
    code?: string;
    errno?: number;
    constraint?: string;
    message?: string;
    driverError?: {
      code?: string;
      errno?: number;
      constraint?: string;
      message?: string;
    };
  };
  const driver = candidate.driverError ?? {};
  const code = candidate.code ?? driver.code;
  const errno = candidate.errno ?? driver.errno;
  const message = (candidate.message ?? driver.message ?? '').toLowerCase();

  return (
    code === 'SQLITE_CONSTRAINT' ||
    code === '23505' ||
    code === 'ER_DUP_ENTRY' ||
    errno === 1062 ||
    message.includes('unique constraint') ||
    message.includes('duplicate entry') ||
    message.includes('duplicate key')
  );
}
