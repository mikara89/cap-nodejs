export class OutboxItemDto {
  id!: string;
  topic!: string;
  status?: string;
  retryCount?: number;
  occurredAt!: Date;
  payloadPreview?: string;
  payload?: unknown;
  headers?: unknown;
}
