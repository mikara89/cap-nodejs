import {
  CAP_MESSAGE_ID_HEADER,
  decodeCapMessage,
  isCapMessageEnvelopeV1,
  type CapHeaders,
  type PublishMetadata,
} from '@mikara89/cap-core';
import {
  defineTransportContract,
  type TransportContractPublishedMessage,
} from '@mikara89/cap-testing';
import { type Observable, of, throwError } from 'rxjs';
import { CapMicroservicesBridge } from './cap-microservices-bridge';
import { CapMicroservicesPublisher } from './cap-microservices-publisher';
import type { CapClientProxyLike } from './client-proxy.interface';

defineTransportContract(
  'NestJS Microservices',
  () => {
    const published: TransportContractPublishedMessage[] = [];
    let publishError: Error | undefined;
    const client: CapClientProxyLike = {
      emit<TResult = unknown, TInput = unknown>(
        topic: unknown,
        message: TInput,
      ) {
        if (publishError) {
          const error = publishError;
          publishError = undefined;
          return throwError(() => error);
        }

        const wrapped = unwrapPublishedMessage(message);
        published.push({ topic: String(topic), ...wrapped });
        return of(undefined) as Observable<TResult>;
      },
    };
    const publisher = new CapMicroservicesPublisher(client, {
      clientToken: 'CONTRACT_CLIENT',
    });
    const subscriber = new CapMicroservicesBridge();

    return Promise.resolve({
      publisher,
      subscriber,
      harness: {
        publishedMessages: () => published,
        failNextPublish: (error: Error) => {
          publishError = error;
        },
        deliver: async ({ topic, group, payload, headers }) =>
          subscriber.dispatch(topic, group, payload, headers, {
            messageId: 'inbound-message-id',
            dedupeKey: 'inbound-dedupe-key',
          }),
      },
      expectedInboundMetadata: {
        messageId: 'inbound-message-id',
        dedupeKey: 'inbound-dedupe-key',
      },
      cleanup: async () => Promise.resolve(),
    });
  },
  {
    supportsPublisherInitialization: false,
    supportsSubscriberInitialization: false,
    supportsPublisherDisposal: false,
    supportsSubscriberDisposal: false,
  },
);

function unwrapPublishedMessage(message: unknown): {
  payload: unknown;
  headers?: CapHeaders;
  metadata?: PublishMetadata;
} {
  if (isCapMessageEnvelopeV1(message)) {
    const decoded = decodeCapMessage(message, {
      legacyEnvelopeMode: 'reject',
    });
    const headers = { ...(decoded.headers ?? {}) };
    const messageId = headers[CAP_MESSAGE_ID_HEADER];
    delete headers[CAP_MESSAGE_ID_HEADER];
    return {
      payload: decoded.payload,
      headers: Object.keys(headers).length === 0 ? undefined : headers,
      metadata:
        messageId === undefined ? undefined : { messageId: String(messageId) },
    };
  }
  return { payload: message };
}
