import { Injectable, Module } from '@nestjs/common';
import { CapModule, CapService, CapSubscribe } from '@mikara89/cap-nest';

interface UserCreatedPayload {
  id: string;
  email: string;
}

@Injectable()
class WelcomeEmailHandler {
  @CapSubscribe({ topic: 'user.created', group: 'welcome-email' })
  async handleUserCreated(payload: UserCreatedPayload): Promise<void> {
    await Promise.resolve(payload.email);
  }
}

@Injectable()
class UsersService {
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
class InMemoryCapExampleModule {}
