import { Controller, Inject, Module } from '@nestjs/common';
import { ClientProxy, ClientsModule, Transport } from '@nestjs/microservices';
import { CapModule } from '@mikara89/cap-nest';
import {
  CapMicroservicesBridge,
  NestjsMicroservicesTransportModule,
} from '@mikara89/cap-transport-nestjs-microservices';

const ORDERS_CLIENT = 'ORDERS_CLIENT';

@Controller()
class OrdersEventsController {
  constructor(private readonly capBridge: CapMicroservicesBridge) {}

  async handleOrderCreated(message: unknown): Promise<void> {
    await this.capBridge.dispatch('order.created', 'orders-worker', message);
  }
}

class OrdersPublisher {
  constructor(@Inject(ORDERS_CLIENT) private readonly client: ClientProxy) {}

  async emitDirectly(): Promise<void> {
    this.client.emit('order.created', { id: 'o1' });
  }
}

const transport = NestjsMicroservicesTransportModule.forRoot({
  clientToken: ORDERS_CLIENT,
  publishTimeoutMs: 5000,
});

@Module({
  imports: [
    ClientsModule.register([
      {
        name: ORDERS_CLIENT,
        transport: Transport.TCP,
      },
    ]),
    transport,
    CapModule.forRoot({
      imports: [transport],
    }),
  ],
  controllers: [OrdersEventsController],
  providers: [OrdersPublisher],
})
class NestjsMicroservicesBridgeExampleModule {}
