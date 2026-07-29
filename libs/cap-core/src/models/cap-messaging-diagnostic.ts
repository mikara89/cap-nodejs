import { type CapPublishStatus } from './cap-publish-event';
import { type CapReceivedStatus } from './cap-received-event';

/** Metadata shared by all best-effort CAP messaging diagnostics events. */
export interface CapMessagingDiagnosticBase {
  readonly type: string;
  readonly id: string;
  readonly topic: string;
  /** ISO-8601 UTC timestamp of the corresponding messaging transition. */
  readonly at: string;
  /** Retry count after the transition, or at the attempted retry. */
  readonly retryCount: number;
}

export interface CapInboxDiagnosticBase extends CapMessagingDiagnosticBase {
  readonly direction: 'inbox';
  readonly group: string;
  readonly messageId: string;
}

export interface CapOutboxDiagnosticBase extends CapMessagingDiagnosticBase {
  readonly direction: 'outbox';
}

export interface CapInboxProcessedDiagnosticEvent extends CapInboxDiagnosticBase {
  readonly type: 'inbox.processed';
}

export interface CapInboxFailedDiagnosticEvent extends CapInboxDiagnosticBase {
  readonly type: 'inbox.failed';
  readonly error: string;
  readonly nextRetryAt: string;
}

export interface CapInboxDeadLetteredDiagnosticEvent extends CapInboxDiagnosticBase {
  readonly type: 'inbox.dead_lettered';
  readonly error: string;
  readonly nextRetryAt: null;
}

export interface CapInboxRetriedDiagnosticEvent extends CapInboxDiagnosticBase {
  readonly type: 'inbox.retried';
  readonly reason: 'failed' | 'stale_pending';
}

export interface CapInboxManuallyRequeuedDiagnosticEvent extends CapInboxDiagnosticBase {
  readonly type: 'inbox.manually_requeued';
  readonly previousStatus?: CapReceivedStatus;
}

export interface CapOutboxPublishedDiagnosticEvent extends CapOutboxDiagnosticBase {
  readonly type: 'outbox.published';
}

export interface CapOutboxFailedDiagnosticEvent extends CapOutboxDiagnosticBase {
  readonly type: 'outbox.failed';
  readonly error: string;
  readonly nextRetryAt: string;
}

export interface CapOutboxDeadLetteredDiagnosticEvent extends CapOutboxDiagnosticBase {
  readonly type: 'outbox.dead_lettered';
  readonly error: string;
  readonly nextRetryAt: null;
}

export interface CapOutboxRetriedDiagnosticEvent extends CapOutboxDiagnosticBase {
  readonly type: 'outbox.retried';
}

export interface CapOutboxManuallyRequeuedDiagnosticEvent extends CapOutboxDiagnosticBase {
  readonly type: 'outbox.manually_requeued';
  readonly previousStatus?: CapPublishStatus;
}

/** Safe operational messaging notifications emitted by CAP. */
export type CapMessagingDiagnosticEvent =
  | CapInboxProcessedDiagnosticEvent
  | CapInboxFailedDiagnosticEvent
  | CapInboxDeadLetteredDiagnosticEvent
  | CapInboxRetriedDiagnosticEvent
  | CapInboxManuallyRequeuedDiagnosticEvent
  | CapOutboxPublishedDiagnosticEvent
  | CapOutboxFailedDiagnosticEvent
  | CapOutboxDeadLetteredDiagnosticEvent
  | CapOutboxRetriedDiagnosticEvent
  | CapOutboxManuallyRequeuedDiagnosticEvent;
