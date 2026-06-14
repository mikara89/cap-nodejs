import { Inject, Injectable } from '@nestjs/common';
import { firstValueFrom, timeout } from 'rxjs';
import type {
  CapHeaders,
  CapPublishMetadata,
  IPublisher,
} from '@mikara89/cap-nest';
import type { CapClientProxyLike } from './client-proxy.interface';
import type { NestjsMicroservicesTransportConfig } from './nestjs-microservices.config';

export const CAP_NESTJS_MICROSERVICES_CLIENT =
  'CAP_NESTJS_MICROSERVICES_CLIENT';
export const CAP_NESTJS_MICROSERVICES_CONFIG =
  'CAP_NESTJS_MICROSERVICES_CONFIG';

@Injectable()
export class CapMicroservicesPublisher implements IPublisher {
  constructor(
    @Inject(CAP_NESTJS_MICROSERVICES_CLIENT)
    private readonly client: CapClientProxyLike,
    @Inject(CAP_NESTJS_MICROSERVICES_CONFIG)
    private readonly config: NestjsMicroservicesTransportConfig,
  ) {}

  async emit(
    topic: string,
    payload: unknown,
    headers?: CapHeaders,
    metadata?: CapPublishMetadata,
  ): Promise<void> {
    const pattern = this.config.patternFactory?.(topic) ?? topic;
    const message =
      headers || metadata ? { payload, headers, metadata } : payload;
    const result = this.client.emit(pattern, message);
    const publishTimeoutMs = this.config.publishTimeoutMs;

    if (publishTimeoutMs && publishTimeoutMs > 0) {
      await firstValueFrom(result.pipe(timeout({ first: publishTimeoutMs })));
      return;
    }

    await firstValueFrom(result);
  }
}
