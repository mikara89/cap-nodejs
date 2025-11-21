import { CapModule, CapAdapterModule } from './cap.module';

describe('CapModule.forAdapters', () => {
  it('returns a DynamicModule that includes providers and imports', () => {
    const storageModule = {
      providers: [{ provide: 'S1', useValue: 1 }],
    } as unknown as CapAdapterModule;
    const transportModule = {
      providers: [{ provide: 'T1', useValue: 2 }],
    } as unknown as CapAdapterModule;

    const dm = CapModule.forAdapters(storageModule, transportModule);

    // Should include imports (adapters module + scheduler attach)
    expect(Array.isArray(dm.imports)).toBe(true);
    expect(dm.providers).toBeDefined();
    // Core providers should include CapService
    const providers = (dm.providers || []) as Array<unknown>;
    const provNames = providers.map((p) => {
      if (!p) return '';
      if (typeof p === 'function') return (p as { name?: string }).name || '';
      if (typeof p === 'object') {
        const obj = p as Record<string, unknown>;
        const name = typeof obj['name'] === 'string' ? obj['name'] : '';
        let provide = '';
        if ('provide' in obj) {
          const pr = obj['provide'];
          if (typeof pr === 'string') provide = pr;
          else if (typeof pr === 'function' && (pr as { name?: string }).name)
            provide = (pr as { name?: string }).name!;
          else if (typeof pr === 'symbol') provide = pr.toString();
        }
        return name || provide;
      }
      return '';
    });

    const found = provNames.some(
      (n) =>
        typeof n === 'string' &&
        (n.includes('CapService') || n === 'CapService'),
    );
    expect(found).toBe(true);
  });
});
