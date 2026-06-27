export type PrismaStorageProvider =
  | 'postgresql'
  | 'postgres'
  | 'mysql'
  | 'mariadb'
  | 'sqlite';

export type ResolvedPrismaStorageProvider = 'postgresql' | 'mysql' | 'sqlite';

export interface PrismaStorageOptions {
  provider: PrismaStorageProvider;
  publishTableName?: string;
  receivedTableName?: string;
}

export interface ResolvedPrismaStorageOptions {
  provider: ResolvedPrismaStorageProvider;
  publishTableName: string;
  receivedTableName: string;
}

export const defaultPrismaStorageTableNames = {
  publishTableName: 'cap_publish',
  receivedTableName: 'cap_received',
} as const;

export function resolvePrismaStorageOptions(
  options: PrismaStorageOptions,
): ResolvedPrismaStorageOptions {
  return {
    provider: resolvePrismaStorageProvider(options.provider),
    publishTableName: validatePrismaIdentifier(
      options.publishTableName ??
        defaultPrismaStorageTableNames.publishTableName,
      40,
    ),
    receivedTableName: validatePrismaIdentifier(
      options.receivedTableName ??
        defaultPrismaStorageTableNames.receivedTableName,
      40,
    ),
  };
}

export function resolvePrismaStorageProvider(
  provider: PrismaStorageProvider,
): ResolvedPrismaStorageProvider {
  if (provider === 'postgres') return 'postgresql';
  if (provider === 'mariadb') return 'mysql';
  return provider;
}

export function validatePrismaIdentifier(
  identifier: string,
  maxLength = 64,
): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(
      `Invalid Prisma storage identifier "${identifier}". Use only letters, numbers, and underscores, starting with a letter or underscore.`,
    );
  }
  if (identifier.length > maxLength) {
    throw new Error(
      `Invalid Prisma storage identifier "${identifier}": identifiers must be at most ${maxLength} characters.`,
    );
  }
  return identifier;
}
