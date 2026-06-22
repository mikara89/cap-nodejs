import type {
  CapDashboardCoreServiceOptions,
  CapDashboardRetryOptions,
  CapDashboardServiceOptions,
  RetryOptions,
} from './dashboard.service';

export type {
  CapDashboardCoreServiceOptions,
  CapDashboardRetryOptions,
  CapDashboardServiceOptions,
  RetryOptions,
};

export interface CapDashboardRedactionOptions {
  headers?: string[];
  payloadPaths?: string[];
}

export const defaultCapDashboardOptions: CapDashboardServiceOptions = {
  readOnly: false,
  maxPageSize: 100,
  redact: {
    headers: ['authorization', 'cookie', 'x-api-key'],
    payloadPaths: [],
  },
};
