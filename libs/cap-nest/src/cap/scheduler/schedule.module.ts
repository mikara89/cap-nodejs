import { Module, DynamicModule, Provider } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RetrySchedulerService } from './schedule.service';

@Module({})
export class CapSchedulerModule {
  static attach(enabled: boolean): {
    imports: NonNullable<DynamicModule['imports']>;
    providers: Provider[];
  } {
    const providers: Provider[] = enabled ? [RetrySchedulerService] : [];

    return {
      imports: enabled ? [ScheduleModule.forRoot()] : [],
      providers,
    };
  }
}
