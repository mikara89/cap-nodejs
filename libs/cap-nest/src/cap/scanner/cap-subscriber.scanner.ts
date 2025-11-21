import { Injectable, OnModuleInit, Logger, Scope } from '@nestjs/common';
import { ModulesContainer, Reflector } from '@nestjs/core';
import { CapService } from '../cap.service';
import {
  CAP_SUBSCRIBE_METADATA,
  CapSubscribeOptions,
} from '../decorators/cap-subscribe.decorator';
import { CapValidatePipe } from '../pipes/cap-validate.pipe';

@Injectable({ scope: Scope.DEFAULT }) // one global instance
export class CapSubscriberScanner implements OnModuleInit {
  private readonly log = new Logger(CapSubscriberScanner.name);

  constructor(
    private readonly modules: ModulesContainer, // all loaded modules
    private readonly reflector: Reflector, // read decorator metadata
    private readonly cap: CapService, // facade (storage+transport)
  ) { }

  onModuleInit() {
    // Walk every provider instance in the app
    for (const { providers } of this.modules.values()) {
      for (const wrapper of providers.values()) {
        const { instance } = wrapper;
        if (!instance || typeof instance !== 'object') continue;

        this.registerDecoratedMethods(instance);
      }
    }
  }

  private registerDecoratedMethods(target: object) {
    const proto = Object.getPrototypeOf(target) as Record<
      string,
      PropertyDescriptor
    > | null;
    if (!proto) return;

    const descriptors = Object.getOwnPropertyDescriptors(proto) as Record<
      string,
      PropertyDescriptor
    >;

    for (const [key, desc] of Object.entries(descriptors)) {
      // skip accessors / non-functions
      if (typeof desc.value !== 'function') continue;

      const meta = this.reflector.get<CapSubscribeOptions | undefined>(
        CAP_SUBSCRIBE_METADATA,
        desc.value as unknown as (...args: unknown[]) => unknown,
      );
      if (!meta) continue;

      const { topic, group = '', filter, dto } = meta;

      const pipe = dto ? new CapValidatePipe(dto as new () => unknown) : null;

      // `desc.value` is guaranteed to be a function here (we checked earlier).
      // Type it as a safe callable and call it via `.call(target, ...)` to
      // avoid unsafe `any` casts and direct binding that ESLint flags.
      const fn = desc.value as (...args: unknown[]) => unknown;
      const invokeBound = (payload: unknown) =>
        Promise.resolve(fn.call(target, payload));

      this.log.debug(
        `@CapSubscribe → ${target.constructor.name}.${key} ` +
        `(${topic}|${group || 'broadcast'})`,
      );

      this.cap.subscribe(topic, group, async (payload: unknown) => {
        const validated = pipe ? pipe.transform(payload) : payload;
        if (!filter || (await filter(validated))) {
          await invokeBound(validated);
        }
      });
    }
  }
}
