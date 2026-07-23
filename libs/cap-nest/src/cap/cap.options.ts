import type { ModuleMetadata } from '@nestjs/common';
import type {
  CapMessageEnvelopeOptions,
  CapTransactionContext,
  CapTransactionManagerPort,
} from '@mikara89/cap-core';
import type { InitOptions } from './abstractions/initializer.interface';

export const CAP_MODULE_OPTIONS = Symbol('CAP_MODULE_OPTIONS');
export const CAP_SCHEDULER_OPTIONS = Symbol('CAP_SCHEDULER_OPTIONS');

export interface CapSchedulerOptions {
  batchSize?: number;
  leaseMs?: number;
  inboxFallbackWindowMs?: number;
  maxRetries?: number;
  maxInboxRetries?: number;
  instanceId?: string;
  disabled?: boolean;
}

export interface ResolvedCapSchedulerOptions {
  batchSize: number;
  leaseMs: number;
  inboxFallbackWindowMs: number;
  maxRetries: number;
  maxInboxRetries: number;
  instanceId: string;
  disabled: boolean;
}

export interface CapModuleOptions {
  imports?: ModuleMetadata['imports'];
  init?: InitOptions;
  scheduler?: CapSchedulerOptions;
  transactionManager?: CapTransactionManagerPort;
  transactionContext?: CapTransactionContext;
  messageEnvelope?: CapMessageEnvelopeOptions;
}
