import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Module,
} from '@nestjs/common';
import { CapModule } from '@mikara89/cap-nest';
import { CapDashboardModule } from '@mikara89/cap-dashboard-nest';

@Injectable()
export class LocalOnlyDashboardGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ ip?: string }>();
    return request.ip === '127.0.0.1' || request.ip === '::1';
  }
}

@Module({
  imports: [
    CapModule.forInMemory(),
    CapDashboardModule.forRoot({
      guard: LocalOnlyDashboardGuard,
      routePrefix: '/api/cap',
      uiRoute: '/cap-dashboard',
    }),
  ],
  providers: [LocalOnlyDashboardGuard],
})
export class DashboardExampleModule {}
