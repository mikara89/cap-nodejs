import type { JsonValue } from '@mikara89/cap-core';
import type { PrismaCapExecutor } from './prisma-cap-client';
import type { ResolvedPrismaStorageProvider } from './prisma-storage-options';
import { validatePrismaIdentifier } from './prisma-storage-options';

export class PrismaSqlBuilder {
  readonly values: unknown[];

  constructor(
    private readonly provider: ResolvedPrismaStorageProvider,
    initialValues: unknown[] = [],
  ) {
    this.values = [...initialValues];
  }

  parameter(value: unknown): string {
    this.values.push(value);
    return this.provider === 'postgresql' ? `$${this.values.length}` : '?';
  }
}

export function quotePrismaIdentifier(
  provider: ResolvedPrismaStorageProvider,
  identifier: string,
): string {
  const validated = validatePrismaIdentifier(identifier);
  return provider === 'mysql' ? `\`${validated}\`` : `"${validated}"`;
}

export function qualifiedPrismaColumn(
  provider: ResolvedPrismaStorageProvider,
  alias: string,
  column: string,
): string {
  return `${quotePrismaIdentifier(provider, alias)}.${quotePrismaIdentifier(
    provider,
    column,
  )}`;
}

export function prismaInsertSql(
  provider: ResolvedPrismaStorageProvider,
  tableName: string,
  columns: string[],
  values: unknown[],
  mode: 'insert' | 'ignoreDedupe' = 'insert',
): { sql: string; values: unknown[] } {
  const builder = new PrismaSqlBuilder(provider);
  const quotedColumns = columns
    .map((column) => quotePrismaIdentifier(provider, column))
    .join(', ');
  const placeholders = values
    .map((value) => builder.parameter(value))
    .join(', ');
  const conflict =
    mode !== 'ignoreDedupe'
      ? ''
      : provider === 'mysql'
        ? ` ON DUPLICATE KEY UPDATE ${quotePrismaIdentifier(
            provider,
            'id',
          )} = IF(LAST_INSERT_ID(1), ${quotePrismaIdentifier(
            provider,
            'id',
          )}, ${quotePrismaIdentifier(provider, 'id')})`
        : ` ON CONFLICT (${quotePrismaIdentifier(
            provider,
            'group',
          )}, ${quotePrismaIdentifier(provider, 'dedupe_key')}) DO NOTHING`;

  return {
    sql: `INSERT INTO ${quotePrismaIdentifier(
      provider,
      tableName,
    )} (${quotedColumns}) VALUES (${placeholders})${conflict}`,
    values: builder.values,
  };
}

export async function executePrismaSql(
  executor: PrismaCapExecutor,
  sql: string,
  values: unknown[] = [],
): Promise<number> {
  return executor.$executeRawUnsafe(sql, ...values);
}

export async function queryPrismaSql<T>(
  executor: PrismaCapExecutor,
  sql: string,
  values: unknown[] = [],
): Promise<T> {
  return executor.$queryRawUnsafe<T>(sql, ...values);
}

export function serializePrismaJson(value: unknown): string | null {
  return value === undefined ? null : JSON.stringify(value);
}

export function deserializePrismaJson<T extends JsonValue = JsonValue>(
  value: unknown,
): T {
  if (value === null || value === undefined) return null as T;
  if (typeof value !== 'string') return value as T;
  return JSON.parse(value) as T;
}

export function toPrismaDbDate(
  value: Date | string | null | undefined,
): string | null {
  if (value === null || value === undefined) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export function toRequiredPrismaDbDate(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

export function fromPrismaDbDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value);
  }
  throw new Error(
    `Unsupported date value from Prisma storage: ${typeof value}`,
  );
}

export function prismaBoolean(value: boolean): number {
  return value ? 1 : 0;
}
