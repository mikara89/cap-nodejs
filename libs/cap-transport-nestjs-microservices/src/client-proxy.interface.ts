import type { Observable } from 'rxjs';

export interface CapClientProxyLike {
  emit<TResult = unknown, TInput = unknown>(
    pattern: unknown,
    data: TInput,
  ): Observable<TResult>;
}
