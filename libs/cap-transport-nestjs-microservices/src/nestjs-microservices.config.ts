import type { InjectionToken } from '@nestjs/common';

export type CapMicroservicesPatternFactory = (topic: string) => unknown;

export interface NestjsMicroservicesTransportConfig {
  clientToken: InjectionToken;
  publishTimeoutMs?: number;
  patternFactory?: CapMicroservicesPatternFactory;
}
