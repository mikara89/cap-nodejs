import type { CapExpressApp } from './create-cap-express';

export type CapExpressLifecycle = Pick<CapExpressApp, 'start' | 'stop'>;
