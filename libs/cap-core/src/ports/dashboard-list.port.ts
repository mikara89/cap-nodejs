export interface DashboardListOptions {
  limit?: number;
  offset?: number;
  topic?: string;
  onlyUnpublished?: boolean;
  due?: boolean;
}

export interface DashboardListResult<T> {
  items: T[];
  total?: number;
}
