import {
  type CapLogger,
  type CapPublishEvent,
  type CapReceivedEvent,
  type PublishStoragePort,
  type PublisherPort,
  type ReceivedStoragePort,
  withCapMessageId,
} from '@mikara89/cap-core';
import type { ActionResultDto } from './dto/action-result.dto';
import type { InboxItemDto } from './dto/inbox-item.dto';
import type { ListQueryDto } from './dto/list-query.dto';
import type { OutboxItemDto } from './dto/outbox-item.dto';
import type { InboxPageDto, OutboxPageDto } from './dto/page.dto';

const DEFAULT_LIST_LIMIT = 50;
const DASHBOARD_LOCK_OWNER = 'cap-dashboard';
const DEFAULT_RETRY_OPTIONS: CapDashboardRetryOptions = {
  maxRetries: 3,
};

export interface RetryOptions {
  force?: boolean;
}

export interface CapDashboardRetryOptions {
  maxRetries: number;
}

export interface CapDashboardRetryHandler {
  retryReceived(rec: CapReceivedEvent): Promise<void>;
}

export interface CapDashboardServiceOptions {
  readOnly: boolean;
  maxPageSize: number;
  redact: {
    headers: string[];
    payloadPaths: string[];
  };
}

export interface CapDashboardCoreServiceOptions {
  publishStorage: PublishStoragePort;
  receivedStorage: ReceivedStoragePort;
  retryHandler?: CapDashboardRetryHandler;
  publisher?: PublisherPort;
  options?: CapDashboardServiceOptions;
  schedulerOptions?: CapDashboardRetryOptions;
  logger?: CapLogger;
}

export class CapDashboardCoreService {
  protected readonly pubStorage: PublishStoragePort;
  protected readonly recStorage: ReceivedStoragePort;
  protected readonly retryHandler?: CapDashboardRetryHandler;
  protected readonly publisher?: PublisherPort;
  protected readonly options: CapDashboardServiceOptions;
  protected readonly schedulerOptions: CapDashboardRetryOptions;
  protected readonly logger?: CapLogger;

  constructor(options: CapDashboardCoreServiceOptions) {
    this.pubStorage = options.publishStorage;
    this.recStorage = options.receivedStorage;
    this.retryHandler = options.retryHandler;
    this.publisher = options.publisher;
    this.options = options.options ?? defaultDashboardOptions();
    this.schedulerOptions = options.schedulerOptions ?? DEFAULT_RETRY_OPTIONS;
    this.logger = options.logger;
  }

  async listOutbox(query: ListQueryDto): Promise<OutboxPageDto> {
    const limit = this.resolveLimit(query);
    let rows: CapPublishEvent[] = [];
    let total = 0;

    try {
      if (this.pubStorage.listPublish) {
        const res = await this.pubStorage.listPublish({
          limit,
          offset: ((query?.page ?? 1) - 1) * limit,
          topic: query?.topic,
          onlyUnpublished: toBoolean(query?.onlyUnpublished),
        });
        rows = res.items;
        total = res.total ?? rows.length;
      }
    } catch (err) {
      this.logger?.warn?.('listPublish adapter method failed', err);
    }

    return {
      items: rows.map((r) => mapPublishToOutboxDto(r, false, this.options)),
      total,
      page: query?.page ?? 1,
      limit,
    };
  }

  async getOutboxById(
    id: string,
    full = false,
  ): Promise<OutboxItemDto | undefined> {
    try {
      const rec = await this.pubStorage.findPublishById?.(id);
      return rec ? mapPublishToOutboxDto(rec, full, this.options) : undefined;
    } catch (err) {
      this.logger?.warn?.('findPublishById failed', err);
      return undefined;
    }
  }

  async retryOutbox(
    id: string,
    _opts?: RetryOptions,
  ): Promise<ActionResultDto> {
    if (this.options.readOnly) return readOnlyResult();

    try {
      const rec = await this.pubStorage.findPublishById?.(id);
      if (!rec) {
        return { success: false, message: `publish record ${id} not found` };
      }
      if (!this.publisher) {
        return {
          success: false,
          message: 'No publisher available to emit message',
        };
      }

      const headers = withCapMessageId(rec.headers, rec.id);
      await this.publisher.emit(rec.topic, rec.payload, headers, {
        messageId: rec.id,
      });
      await this.pubStorage.markPublished(id, new Date());
      return { success: true, message: 'Published successfully' };
    } catch (err: unknown) {
      this.logger?.error?.('retryOutbox failed', err);
      return { success: false, message: errorMessage(err) };
    }
  }

  async markOutboxPublished(id: string): Promise<ActionResultDto> {
    if (this.options.readOnly) return readOnlyResult();

    try {
      await this.pubStorage.markPublished(id, new Date());
      return { success: true };
    } catch (err: unknown) {
      this.logger?.error?.('markOutboxPublished failed', err);
      return { success: false, message: errorMessage(err) };
    }
  }

  async listInbox(query: ListQueryDto): Promise<InboxPageDto> {
    const limit = this.resolveLimit(query);

    try {
      if (this.recStorage.listReceived) {
        const res = await this.recStorage.listReceived({
          limit,
          offset: ((query?.page ?? 1) - 1) * limit,
          topic: query?.topic,
          due: toBoolean(query?.due),
        });
        return {
          items: res.items.map((r) =>
            mapReceivedToInboxDto(r, false, this.options),
          ),
          total: res.total ?? res.items.length,
          page: query?.page ?? 1,
          limit,
        };
      }
    } catch (err) {
      this.logger?.warn?.('listReceived adapter failed', err);
    }

    return { items: [], total: 0, page: query?.page ?? 1, limit };
  }

  async getInboxById(
    id: string,
    full = false,
  ): Promise<InboxItemDto | undefined> {
    try {
      const rec = await this.recStorage.findReceivedById?.(id);
      return rec ? mapReceivedToInboxDto(rec, full, this.options) : undefined;
    } catch (err) {
      this.logger?.warn?.('findReceivedById failed', err);
      return undefined;
    }
  }

  async retryInbox(id: string, _opts?: RetryOptions): Promise<ActionResultDto> {
    if (this.options.readOnly) return readOnlyResult();

    try {
      const rec = await this.recStorage.findReceivedById?.(id);
      if (!rec) {
        return { success: false, message: `received record ${id} not found` };
      }
      if (!this.retryHandler) {
        return {
          success: false,
          message: 'Retry handler not available to retry inbox message',
        };
      }

      await this.retryHandler.retryReceived(rec);
      return { success: true, message: 'Retry scheduled/executed' };
    } catch (err: unknown) {
      this.logger?.error?.('retryInbox failed', err);
      return { success: false, message: errorMessage(err) };
    }
  }

  async markInboxProcessed(id: string): Promise<ActionResultDto> {
    if (this.options.readOnly) return readOnlyResult();

    try {
      await this.recStorage.markProcessed(id);
      return { success: true };
    } catch (err: unknown) {
      this.logger?.error?.('markInboxProcessed failed', err);
      return { success: false, message: errorMessage(err) };
    }
  }

  async flushOutbox(): Promise<ActionResultDto> {
    if (this.options.readOnly) return readOnlyResult();

    try {
      if (!this.publisher) {
        return {
          success: false,
          message: 'No publisher available to emit messages',
        };
      }

      const now = new Date();
      await this.pubStorage.releaseExpiredClaims(now);
      const rows = await this.pubStorage.claimUnpublished({
        limit: this.resolveLimit({ limit: DEFAULT_LIST_LIMIT }),
        lockedBy: DASHBOARD_LOCK_OWNER,
        lockUntil: new Date(now.getTime() + 30_000),
        now,
      });
      let published = 0;
      let failed = 0;

      for (const rec of rows) {
        try {
          const headers = withCapMessageId(rec.headers, rec.id);
          await this.publisher.emit(rec.topic, rec.payload, headers, {
            messageId: rec.id,
          });
          await this.pubStorage.markPublished(rec.id, new Date());
          published++;
        } catch (err) {
          failed++;
          await this.pubStorage.markPublishFailed(rec.id, err, {
            maxRetries: this.schedulerOptions.maxRetries,
            nextRetryAt: new Date(Date.now() + 1000),
            now: new Date(),
          });
          this.logger?.warn?.(`flushOutbox failed for ${rec.id}`, err);
        }
      }

      return {
        success: failed === 0,
        message: `Flush complete: ${published} published, ${failed} failed`,
      };
    } catch (err: unknown) {
      this.logger?.error?.('flushOutbox failed', err);
      return { success: false, message: errorMessage(err) };
    }
  }

  private resolveLimit(query: Pick<ListQueryDto, 'limit'> | undefined): number {
    const requested = query?.limit ?? DEFAULT_LIST_LIMIT;
    return Math.min(
      Math.max(Number(requested) || DEFAULT_LIST_LIMIT, 1),
      this.options.maxPageSize,
    );
  }
}

function mapPublishToOutboxDto(
  evt: CapPublishEvent,
  full: boolean,
  options: CapDashboardServiceOptions,
): OutboxItemDto {
  const redactedPayload = redactPayload(
    evt.payload,
    options.redact.payloadPaths,
  );
  const redactedHeaders = redactHeaders(evt.headers, options.redact.headers);

  return {
    id: evt.id,
    topic: evt.topic,
    status: evt.status,
    retryCount: evt.retryCount,
    occurredAt: evt.occurredAt ? new Date(evt.occurredAt) : new Date(),
    payloadPreview:
      !full && redactedPayload
        ? String(JSON.stringify(redactedPayload)).slice(0, 300)
        : undefined,
    payload: full ? redactedPayload : undefined,
    headers: full ? redactedHeaders : undefined,
  };
}

function mapReceivedToInboxDto(
  evt: CapReceivedEvent,
  full: boolean,
  options: CapDashboardServiceOptions,
): InboxItemDto {
  const redactedPayload = redactPayload(
    evt.payload,
    options.redact.payloadPaths,
  );
  const redactedHeaders = redactHeaders(evt.headers, options.redact.headers);

  return {
    id: evt.id,
    topic: evt.topic,
    messageId: evt.messageId,
    dedupeKey: evt.dedupeKey,
    status: evt.status,
    processed: evt.processed,
    retryCount: evt.retryCount,
    lastError: evt.lastError ?? null,
    nextRetry: evt.nextRetry ?? undefined,
    processedAt: evt.processedAt ?? null,
    payloadPreview:
      !full && redactedPayload
        ? String(JSON.stringify(redactedPayload)).slice(0, 300)
        : undefined,
    payload: full ? redactedPayload : undefined,
    headers: full ? redactedHeaders : undefined,
  };
}

function defaultDashboardOptions(): CapDashboardServiceOptions {
  return {
    readOnly: false,
    maxPageSize: 100,
    redact: {
      headers: ['authorization', 'cookie', 'x-api-key'],
      payloadPaths: [],
    },
  };
}

function redactHeaders(headers: unknown, sensitiveHeaders: string[]): unknown {
  if (!headers || typeof headers !== 'object' || Array.isArray(headers)) {
    return headers;
  }
  const sensitive = new Set(sensitiveHeaders.map((h) => h.toLowerCase()));
  return Object.fromEntries(
    Object.entries(headers as Record<string, unknown>).map(([key, value]) => [
      key,
      sensitive.has(key.toLowerCase()) ? '[redacted]' : value,
    ]),
  );
}

function redactPayload(payload: unknown, paths: string[]): unknown {
  if (!paths.length || !payload || typeof payload !== 'object') return payload;
  const clone = structuredCloneSafe(payload);
  for (const path of paths) redactPath(clone, path.split('.'));
  return clone;
}

function redactPath(target: unknown, parts: string[]): void {
  if (!target || typeof target !== 'object' || !parts.length) return;
  const record = target as Record<string, unknown>;
  const [head, ...tail] = parts;
  if (!head || !(head in record)) return;
  if (!tail.length) {
    record[head] = '[redacted]';
    return;
  }
  redactPath(record[head], tail);
}

function structuredCloneSafe(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value)) as unknown;
}

function toBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === '1';
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function readOnlyResult(): ActionResultDto {
  return { success: false, message: 'Dashboard is read-only' };
}
