import type { CapReceivedStatus } from '@mikara89/cap-nest';

export class InboxItemDto {
  id!: string;
  topic!: string;
  messageId?: string;
  dedupeKey?: string;
  status?: CapReceivedStatus;
  processed?: boolean;
  retryCount?: number;
  lastError?: string | null;
  nextRetry?: Date;
  processedAt?: Date | null;
  payloadPreview?: string;
  payload?: unknown;
  headers?: unknown;
}
