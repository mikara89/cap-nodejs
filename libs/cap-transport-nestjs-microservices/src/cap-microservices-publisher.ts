import { Inject, Injectable } from '@nestjs/common';
import { firstValueFrom, timeout } from 'rxjs';
import type {
  CapHeaders,
  JsonValue,
  PublishMetadata,
  PublisherPort,
} from '@mikara89/cap-core';
import { createCapMessageEnvelope, withCapMessageId } from '@mikara89/cap-core';
import type { CapClientProxyLike } from './client-proxy.interface';
import type { NestjsMicroservicesTransportConfig } from './nestjs-microservices.config';

export const CAP_NESTJS_MICROSERVICES_CLIENT =
  'CAP_NESTJS_MICROSERVICES_CLIENT';
export const CAP_NESTJS_MICROSERVICES_CONFIG =
  'CAP_NESTJS_MICROSERVICES_CONFIG';

@Injectable()
export class CapMicroservicesPublisher implements PublisherPort {
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
    metadata?: PublishMetadata,
  ): Promise<void> {
    const pattern = this.config.patternFactory?.(topic) ?? topic;
    const envelopeHeaders = metadata?.messageId
      ? withCapMessageId(headers, metadata.messageId)
      : headers;
    const message = envelopeHeaders
      ? createCapMessageEnvelope(payload as JsonValue, envelopeHeaders)
      : payload;
    const result = this.client.emit(pattern, message);
    const publishTimeoutMs = this.config.publishTimeoutMs;

    if (publishTimeoutMs && publishTimeoutMs > 0) {
      await firstValueFrom(result.pipe(timeout({ first: publishTimeoutMs })));
      return;
    }

    await firstValueFrom(result);
  }
}
