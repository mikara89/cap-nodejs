import 'reflect-metadata';
import { SetMetadata } from '@nestjs/common';
import { type CapHeaders } from '../models/cap-headers.type';

/** ----------------------------------------------------------------
 *  Public decorator API
 *  ----------------------------------------------------------------
 */

/**
 * Options recognized by `@CapSubscribe`.
 *
 * * `topic`  – logical topic / exchange / subject.
 * * `group`  – queue / consumer-group name.  Omit if you want a
 *              broadcast queue that every subscriber receives.
 * * `filter` – (optional) user-defined predicate that can short-circuit
 *              delivery before your handler executes.
 */
export interface CapSubscribeOptions<T = unknown> {
  topic: string;
  group?: string;
  dto?: new () => T;
  filter?: (payload: T) => boolean | Promise<boolean>;
}

/**
 * Symbol under which the framework stores metadata.  Exported so
 * helper utilities (e.g. the worker) can reuse the constant without
 * string-literals.
 */
export const CAP_SUBSCRIBE_METADATA = 'CAP_SUBSCRIBE_METADATA';

/**
 * Decorate a *method* so the CAP worker knows it should be invoked
 * when a message on `topic` (optionally `group`) arrives.
 *
 * ```ts
 * @CapSubscribe({ topic: 'user.created', group: 'mail-service' })
 * async handleUserCreated(evt: UserCreated) { … }
 * ```
 */
export function CapSubscribe<T = unknown>(
  opts: CapSubscribeOptions<T> | string,
  maybeGroup?: string,
): MethodDecorator {
  // Support legacy signature  @CapSubscribe('topic','group')
  const normalized: CapSubscribeOptions = (
    typeof opts === 'string' ? { topic: opts, group: maybeGroup } : opts
  ) as CapSubscribeOptions;

  return SetMetadata(CAP_SUBSCRIBE_METADATA, normalized);
}

/** ----------------------------------------------------------------
 *  Helper utilities (optional)
 *  ----------------------------------------------------------------
 */

/**
 * Discover every method on an instance that is decorated with
 * `@CapSubscribe` and return an array of runnable subscriptions.
 *
 * ```ts
 * const subs = discoverSubscriptions(serviceInstance);
 * subs.forEach(s =>
 *   capService.subscribe(s.topic, s.group, s.handler, s.filter));
 * ```
 */
export function discoverSubscriptions(
  instance: object,
): DiscoveredSubscription[] {
  const proto = Object.getPrototypeOf(instance) as Record<
    string,
    unknown
  > | null;
  if (!proto) return [];

  const subs: DiscoveredSubscription[] = [];

  for (const key of Object.getOwnPropertyNames(proto)) {
    const desc = Object.getOwnPropertyDescriptor(proto, key);

    let fn: ((...args: unknown[]) => unknown) | undefined;

    if (desc && typeof desc.value === 'function') {
      fn = desc.value as (...args: unknown[]) => unknown;
    } else {
      const maybe = (instance as Record<string, unknown>)[key];
      if (typeof maybe === 'function') {
        fn = maybe as (...args: unknown[]) => unknown;
      }
    }

    if (!fn) continue;

    const meta =
      (Reflect.getMetadata(CAP_SUBSCRIBE_METADATA, fn) as
        | CapSubscribeOptions
        | undefined) ??
      (Reflect.getMetadata(CAP_SUBSCRIBE_METADATA, instance, key) as
        | CapSubscribeOptions
        | undefined) ??
      (Reflect.getMetadata(CAP_SUBSCRIBE_METADATA, proto, key) as
        | CapSubscribeOptions
        | undefined);

    if (!meta) continue;

    const opts = meta;

    const boundHandler = async (
      payload: unknown,
      headers?: CapHeaders,
    ): Promise<unknown> =>
      Promise.resolve(fn.call(instance, payload, headers) as unknown);

    subs.push({
      topic: opts.topic,
      group: opts.group ?? undefined,
      filter: opts.filter,
      handler: boundHandler,
    });
  }

  return subs;
}

/** Shape returned by `discoverSubscriptions` */
export interface DiscoveredSubscription {
  topic: string;
  group?: string;
  filter?: (payload: unknown) => boolean | Promise<boolean>;
  handler: (payload: unknown, headers?: CapHeaders) => Promise<unknown>;
}
