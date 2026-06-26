export interface KnexStorageTableOptions {
  publishTableName?: string;
  receivedTableName?: string;
}

export type KnexStorageOptions = KnexStorageTableOptions;

export interface ResolvedKnexStorageOptions {
  publishTableName: string;
  receivedTableName: string;
}

export const defaultKnexStorageOptions: ResolvedKnexStorageOptions = {
  publishTableName: 'cap_publish',
  receivedTableName: 'cap_received',
};

export function resolveKnexStorageOptions(
  options: KnexStorageOptions = {},
): ResolvedKnexStorageOptions {
  return {
    publishTableName:
      options.publishTableName ?? defaultKnexStorageOptions.publishTableName,
    receivedTableName:
      options.receivedTableName ?? defaultKnexStorageOptions.receivedTableName,
  };
}
