export interface TypeOrmStorageTableOptions {
  publishTableName?: string;
  receivedTableName?: string;
}

export type TypeOrmStorageOptions = TypeOrmStorageTableOptions;

export interface ResolvedTypeOrmStorageOptions {
  publishTableName: string;
  receivedTableName: string;
}

export const defaultTypeOrmStorageOptions: ResolvedTypeOrmStorageOptions = {
  publishTableName: 'cap_publish',
  receivedTableName: 'cap_received',
};

export function resolveTypeOrmStorageOptions(
  options: TypeOrmStorageOptions = {},
): ResolvedTypeOrmStorageOptions {
  return {
    publishTableName:
      options.publishTableName ?? defaultTypeOrmStorageOptions.publishTableName,
    receivedTableName:
      options.receivedTableName ??
      defaultTypeOrmStorageOptions.receivedTableName,
  };
}
