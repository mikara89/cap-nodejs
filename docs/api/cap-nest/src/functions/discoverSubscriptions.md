[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / discoverSubscriptions

# Function: discoverSubscriptions()

> **discoverSubscriptions**(`instance`): [`DiscoveredSubscription`](../interfaces/DiscoveredSubscription.md)[]

Defined in: [cap-nest/src/cap/decorators/cap-subscribe.decorator.ts:72](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/decorators/cap-subscribe.decorator.ts#L72)

Discover every method on an instance that is decorated with
`@CapSubscribe` and return an array of runnable subscriptions.

```ts
const subs = discoverSubscriptions(serviceInstance);
subs.forEach(s =>
  capService.subscribe(s.topic, s.group, s.handler, s.filter));
```

## Parameters

### instance

`object`

## Returns

[`DiscoveredSubscription`](../interfaces/DiscoveredSubscription.md)[]
