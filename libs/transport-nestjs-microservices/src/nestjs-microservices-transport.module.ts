import { DynamicModule, Module } from '@nestjs/common';
import { PUBLISHER, SUBSCRIBER } from '@mikara89/cap-nest';
import { CapMicroservicesBridge } from './cap-microservices-bridge';
import {
  CAP_NESTJS_MICROSERVICES_CLIENT,
  CAP_NESTJS_MICROSERVICES_CONFIG,
  CapMicroservicesPublisher,
} from './cap-microservices-publisher';
import type { NestjsMicroservicesTransportConfig } from './nestjs-microservices.config';

@Module({})
export class NestjsMicroservicesTransportModule {
  static forRoot(config: NestjsMicroservicesTransportConfig): DynamicModule {
    return {
      module: NestjsMicroservicesTransportModule,
      providers: [
        {
          provide: CAP_NESTJS_MICROSERVICES_CONFIG,
          useValue: config,
        },
        {
          provide: CAP_NESTJS_MICROSERVICES_CLIENT,
          useExisting: config.clientToken,
        },
        CapMicroservicesBridge,
        CapMicroservicesPublisher,
        {
          provide: PUBLISHER,
          useExisting: CapMicroservicesPublisher,
        },
        {
          provide: SUBSCRIBER,
          useExisting: CapMicroservicesBridge,
        },
      ],
      exports: [PUBLISHER, SUBSCRIBER, CapMicroservicesBridge],
    };
  }
}
