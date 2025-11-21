import { CapSubscribe, discoverSubscriptions } from './cap-subscribe.decorator';

describe('CapSubscribe discoverSubscriptions', () => {
  it('discovers decorated methods on an instance', () => {
    class C {
      @CapSubscribe('my.topic', 'g1')
      handler(payload: unknown) {
        return payload;
      }
    }

    const inst = new C();
    const subs = discoverSubscriptions(inst);
    expect(subs.length).toBeGreaterThan(0);
    const s = subs.find((x) => x.topic === 'my.topic');
    expect(s).toBeTruthy();
    expect(typeof s!.handler).toBe('function');
  });
});
