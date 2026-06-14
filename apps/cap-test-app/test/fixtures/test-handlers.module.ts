import { Module, Injectable } from '@nestjs/common';
import { CapSubscribe } from '@mikara89/cap-nest';
import { UserCreatedDto, OrderPlacedDto } from './test-messages';

/**
 * Test service with CAP message handlers for integration testing.
 */
@Injectable()
export class TestHandlerService {
  // Track handler invocations
  public userCreatedCalls: UserCreatedDto[] = [];
  public orderPlacedCalls: OrderPlacedDto[] = [];
  public errorCalls: any[] = [];

  // Control handler behavior
  public shouldFailUserCreated = false;
  public shouldFailOrderPlaced = false;

  @CapSubscribe({
    topic: 'user.created',
    group: 'test-service',
    dto: UserCreatedDto,
  })
  handleUserCreated(payload: UserCreatedDto): Promise<void> {
    this.userCreatedCalls.push(payload);

    if (this.shouldFailUserCreated) {
      throw new Error('User created handler failed');
    }
    return Promise.resolve();
  }

  @CapSubscribe({
    topic: 'order.placed',
    group: 'test-service',
    dto: OrderPlacedDto,
  })
  handleOrderPlaced(payload: OrderPlacedDto): Promise<void> {
    this.orderPlacedCalls.push(payload);

    if (this.shouldFailOrderPlaced) {
      throw new Error('Order placed handler failed');
    }
    return Promise.resolve();
  }

  @CapSubscribe({
    topic: 'error.test',
    group: 'test-service',
  })
  handleErrorTest(payload: any): Promise<void> {
    this.errorCalls.push(payload);
    throw new Error('Intentional error for testing');
  }

  reset(): void {
    this.userCreatedCalls = [];
    this.orderPlacedCalls = [];
    this.errorCalls = [];
    this.shouldFailUserCreated = false;
    this.shouldFailOrderPlaced = false;
  }
}

/**
 * Multiple handlers for the same topic (different consumer groups).
 */
@Injectable()
export class AlternateHandlerService {
  public userCreatedCalls: UserCreatedDto[] = [];

  @CapSubscribe({
    topic: 'user.created',
    group: 'alternate-service',
    dto: UserCreatedDto,
  })
  handleUserCreated(payload: UserCreatedDto): Promise<void> {
    this.userCreatedCalls.push(payload);
    return Promise.resolve();
  }

  reset(): void {
    this.userCreatedCalls = [];
  }
}

@Module({
  providers: [TestHandlerService, AlternateHandlerService],
  exports: [TestHandlerService, AlternateHandlerService],
})
export class TestHandlersModule {}
