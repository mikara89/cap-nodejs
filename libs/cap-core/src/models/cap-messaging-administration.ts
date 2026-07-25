/** Result of a manual durable-message requeue request. */
export type CapRequeueOutcome = 'requeued' | 'not_found' | 'not_eligible';

export interface CapRequeueResult<TStatus extends string = string> {
  id: string;
  outcome: CapRequeueOutcome;
  previousStatus?: TStatus;
}

export interface CapInboxStatusCounts {
  pending: number;
  processing: number;
  processed: number;
  failed: number;
  dead_letter: number;
}

export interface CapOutboxStatusCounts {
  pending: number;
  processing: number;
  published: number;
  failed: number;
  dead_letter: number;
}

/**
 * Operational inbox state. Timestamp ages are the earliest durable
 * created-at/occurred-at value for a row currently in the named status.
 */
export interface CapInboxSnapshot {
  counts: CapInboxStatusCounts;
  oldestPendingAt: Date | null;
  oldestFailedAt: Date | null;
}

/**
 * Operational outbox state. Timestamp ages are the earliest durable
 * created-at/occurred-at value for a row currently in the named status.
 */
export interface CapOutboxSnapshot {
  counts: CapOutboxStatusCounts;
  oldestPendingAt: Date | null;
  oldestFailedAt: Date | null;
}

/**
 * Operational messaging state. Inbox and outbox are read independently and
 * can therefore reflect slightly different instants under concurrent work.
 */
export interface CapMessagingSnapshot {
  inbox: CapInboxSnapshot;
  outbox: CapOutboxSnapshot;
}
