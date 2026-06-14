import { Injectable, Module } from '@nestjs/common';
import { CapModule, CapService, CapSubscribe } from '@cap/cap-nest';

interface UserCreatedPayload {
  id: string;
  email: string;
}

@Injectable()
export class WelcomeEmailHandler {
  @CapSubscribe({ topic: 'user.created', group: 'welcome-email' })
  async handleUserCreated(payload: UserCreatedPayload): Promise<void> {
    await Promise.resolve(payload.email);
  }
}

@Injectable()
export class UsersService {
  constructor(private readonly cap: CapService) {}

  async createUser(): Promise<void> {
    await this.cap.publish<UserCreatedPayload>('user.created', {
      id: 'u1',
      email: 'alice@example.com',
    });
  }
}

@Module({
  imports: [CapModule.forInMemory()],
  providers: [UsersService, WelcomeEmailHandler],
})
export class InMemoryCapExampleModule {}
